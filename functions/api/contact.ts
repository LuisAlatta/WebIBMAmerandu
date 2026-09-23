/**
 * Pages Function: la ruta del archivo publica POST /api/contact en Cloudflare.
 * Recibe datos del formulario, los valida y arma el correo para POST /send.
 * Las credenciales solo se leen de context.env en el servidor, nunca del cliente.
 * Se ejecuta con Wrangler o en Pages; astro dev no sirve esta ruta.
 * Ver README.md para configuración local y despliegue.
 */
import { renderContactEmail } from "../../src/server/contact-email.ts";

interface Env {
  MAIL_GATEWAY_URL: string;
  MAIL_GATEWAY_TOKEN: string;
  MAIL_GATEWAY_FROM: string;
  // preview:cloudflare fija "local"; sin esta variable se usan los destinatarios del club.
  MAIL_ENV?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxFileBytes = 5 * 1024 * 1024;
const maxBase64Length = 4 * Math.ceil(maxFileBytes / 3);
// Base64 ocupa aproximadamente 4/3 del archivo. Se reserva espacio para el JSON.
const maxBodyBytes = maxBase64Length + 64 * 1024;
const json = (body: object, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store" },
});
const failure = (code: string, status: number) => json({ success: false, code }, status);

export async function onRequest({ request, env }: { request: Request; env: Env }) {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { Allow: "POST" } });
  }
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return failure("ORIGIN_REJECTED", 403);
  }
  if (!request.headers.get("Content-Type")?.includes("application/json")) {
    return failure("INVALID_CONTENT_TYPE", 415);
  }

  // Limit the body even when Content-Length is absent.
  const reader = request.body?.getReader();
  if (!reader) return failure("INVALID_INPUT", 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBodyBytes) {
      await reader.cancel();
      return failure("BODY_TOO_LARGE", 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
  } catch { return failure("INVALID_INPUT", 400); }
  // El límite de texto sigue siendo independiente del espacio reservado al CV.
  if (new TextEncoder().encode(JSON.stringify({ ...data, attachment: undefined })).byteLength > 16384) {
    return failure("BODY_TOO_LARGE", 413);
  }
  const field = (key: string, max: number) => typeof data[key] === "string"
    && data[key].trim().length <= max ? data[key].trim() : "";
  const nombre = field("nombre", 200);
  const email = field("email", 254);
  const pais = field("pais", 100);
  const telefono = field("telefono", 40);
  const experiencia = field("experiencia", 5000);
  const volunteer = data.formType === "volunteer";
  if (!nombre || !emailPattern.test(email) || !pais || !/^\+?[\d ()-]{6,40}$/.test(telefono)
    || !["club", "volunteer"].includes(String(data.formType))
    || (volunteer && (typeof data.edad !== "number" || !Number.isInteger(data.edad) || data.edad < 18))
    || (data.experiencia != null && (typeof data.experiencia !== "string" || data.experiencia.length > 5000))
    || data.cv != null) {
    return failure("INVALID_INPUT", 400);
  }
  let attachment: Array<{ name: string; content: string }> | undefined;
  if (data.attachment != null) {
    if (!volunteer || !Array.isArray(data.attachment) || data.attachment.length !== 1) {
      return failure("INVALID_ATTACHMENT", 400);
    }
    const file = data.attachment[0];
    if (!file || typeof file !== "object" || typeof file.name !== "string"
      || file.name.length > 255 || /[\x00-\x1f\x7f/\\]/.test(file.name)
      || !/^.+\.(pdf|doc|docx)$/i.test(file.name)
      || typeof file.content !== "string" || !file.content.length
      || file.content.length > maxBase64Length || file.content.length % 4 !== 0
      || file.url != null) {
      return failure("INVALID_ATTACHMENT", 400);
    }
    try {
      const decoded = atob(file.content);
      if (!decoded.length || decoded.length > maxFileBytes || btoa(decoded) !== file.content) {
        return failure("INVALID_ATTACHMENT", 400);
      }
    } catch { return failure("INVALID_ATTACHMENT", 400); }
    // Solo se reenvían nombre y contenido validados; no se aceptan URLs externas.
    attachment = [{ name: file.name, content: file.content }];
  }
  if (!env.MAIL_GATEWAY_TOKEN || !env.MAIL_GATEWAY_URL || !emailPattern.test(env.MAIL_GATEWAY_FROM || "")) {
    return failure("MAIL_CONFIG_MISSING", 503);
  }
  const interest = volunteer ? "Quiero ser voluntario" : "Quiero unirme al club";
  const fields = [["Nombre y Apellido", nombre], ["Email", email], ["País", pais],
    ["Teléfono", telefono], ["Interés", interest]];
  if (volunteer) fields.push(["Edad", String(data.edad)], ["Experiencia y habilidades", experiencia || "No proporcionadas"]);
  if (attachment) fields.push(["CV adjunto", attachment[0].name]);

  let url: URL;
  try {
    url = new URL(env.MAIL_GATEWAY_URL);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error();
  } catch { return failure("MAIL_URL_INVALID", 503); }
  try {
    const path = url.pathname.replace(/\/+$/, "");
    url.pathname = path.endsWith("/send") ? path : `${path}/send`;
    const response = await fetch(url, {
      method: "POST",
      // Use manual for compatibility with older workerd versions; never forward the token on redirects.
      redirect: "manual",
      headers: { Authorization: `Bearer ${env.MAIL_GATEWAY_TOKEN}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        from: env.MAIL_GATEWAY_FROM,
        fromName: "Amerandú",
        replyTo: email,
        to: env.MAIL_ENV === "local"
          ? [{ email: "test@imbinstitute.com" }]
          : [{ email: "ameranduclub@gmail.com" }, { email: "newluisalatta@gmail.com" }],
        subject: `Nuevo contacto de Amerandú — ${interest}`,
        htmlContent: renderContactEmail(fields, interest, email),
        ...(attachment ? { attachment } : {}),
        tag: volunteer ? "voluntariado" : "club",
      }),
    });
    if (!response.ok) {
      const code = response.status >= 300 && response.status < 400 ? "GATEWAY_REDIRECT"
        : response.status === 401 || response.status === 403 ? "GATEWAY_AUTH_REJECTED"
        : response.status === 404 ? "GATEWAY_NOT_FOUND"
        : response.status === 429 ? "GATEWAY_RATE_LIMITED" : "GATEWAY_REJECTED";
      return failure(code, 502);
    }
    let result: { success?: boolean } | null;
    try { result = await response.json(); }
    catch { return failure("GATEWAY_INVALID_RESPONSE", 502); }
    if (result?.success !== true) return failure("GATEWAY_REJECTED", 502);
    return json({ success: true });
  } catch (error) {
    const timeout = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
    return failure(timeout ? "GATEWAY_TIMEOUT" : "GATEWAY_CONNECTION_FAILED", 502);
  }
}
