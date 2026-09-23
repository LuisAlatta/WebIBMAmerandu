/**
 * Pages Function: la ruta del archivo publica POST /api/contact en Cloudflare.
 * Recibe datos del formulario, los valida y arma el correo para POST /send.
 * Las credenciales solo se leen de context.env en el servidor, nunca del cliente.
 * Se ejecuta con Wrangler o en Pages; astro dev no sirve esta ruta.
 * Ver docs/arquitectura.md para configuración, destinatarios y códigos de error.
 */
interface Env {
  MAIL_GATEWAY_URL: string;
  MAIL_GATEWAY_TOKEN: string;
  MAIL_GATEWAY_FROM: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Los datos del visitante son texto, no HTML confiable, dentro de la plantilla.
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => (
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!
));
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
    if (size > 16384) {
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
    || data.cv != null || data.attachment != null) {
    return failure("INVALID_INPUT", 400);
  }
  if (!env.MAIL_GATEWAY_TOKEN || !env.MAIL_GATEWAY_URL || !emailPattern.test(env.MAIL_GATEWAY_FROM || "")) {
    return failure("MAIL_CONFIG_MISSING", 503);
  }
  const interest = volunteer ? "Quiero ser voluntario" : "Quiero unirme al club";
  const fields = [["Nombre y Apellido", nombre], ["Email", email], ["País", pais],
    ["Teléfono", telefono], ["Interés", interest]];
  if (volunteer) fields.push(["Edad", String(data.edad)], ["Experiencia y habilidades", experiencia || "No proporcionadas"]);

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
        // Destinatario actual de pruebas. Editar aquí para cambiar quién recibe el correo.
        // Destinatarios previstos: ameranduclub@gmail.com y newluisalatta@gmail.com.
        to: [{ email: "test@imbinstitute.com" }],
        subject: `Nuevo contacto de Amerandú — ${interest}`,
        htmlContent: `<h1>Nuevo contacto de Amerandú</h1><table>${fields.map(([label, value]) =>
          `<tr><th>${label}</th><td style="white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join("")}</table>`,
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
