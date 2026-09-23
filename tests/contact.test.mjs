import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/api/contact.ts";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const env = {
  MAIL_GATEWAY_URL: "https://gateway.example.com",
  MAIL_GATEWAY_TOKEN: "test-secret",
  MAIL_GATEWAY_FROM: "contact@example.com",
};
const data = { formType: "club", nombre: "Ana <script>", email: "ana@example.com", pais: "Perú", telefono: "+51999888777" };
const request = (body = data) => new Request("https://site.example.com/api/contact", {
  method: "POST", headers: { "Content-Type": "application/json", Origin: "https://site.example.com" },
  body: JSON.stringify(body),
});

test("sends the gateway contract, escapes HTML and keeps secrets server-side", async () => {
  let sent;
  let sentUrl;
  let sentOptions;
  globalThis.fetch = async (url, options) => {
    sentUrl = String(url);
    sentOptions = options;
    sent = JSON.parse(options.body);
    return Response.json({ success: true, messageId: "accepted" });
  };
  const response = await onRequest({ request: request(), env });
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(sentUrl, "https://gateway.example.com/send");
  assert.equal(sentOptions.redirect, "manual");
  assert.equal(sentOptions.headers.Authorization, "Bearer test-secret");
  assert.equal(sent.from, env.MAIL_GATEWAY_FROM);
  assert.equal(sent.replyTo, data.email);
  assert.equal(sent.attachment, undefined);
  assert.deepEqual(sent.to, [{ email: "ameranduclub@gmail.com" }, { email: "newluisalatta@gmail.com" }]);
  assert.ok(sent.htmlContent.includes("Ana &lt;script&gt;"));
  assert.equal(sent.tag, "club");
});

test("supports a /send URL, volunteer details and a base64 CV", async () => {
  let sent;
  let sentUrl;
  const attachment = [{ name: "cv.pdf", content: btoa("%PDF-1.4\nCV de ejemplo") }];
  globalThis.fetch = async (url, options) => {
    sentUrl = String(url);
    sent = JSON.parse(options.body);
    return Response.json({ success: true });
  };
  const response = await onRequest({
    request: request({ ...data, formType: "volunteer", edad: 22, experiencia: "Diseño & arte", attachment }),
    env: { ...env, MAIL_GATEWAY_URL: "https://gateway.example.com/send/" },
  });
  assert.equal(response.status, 200);
  assert.equal(sentUrl, "https://gateway.example.com/send");
  assert.equal(sent.tag, "voluntariado");
  assert.ok(sent.htmlContent.includes("Diseño &amp; arte"));
  assert.deepEqual(sent.attachment, attachment);
  assert.ok(sent.htmlContent.includes("cv.pdf"));
});

test("rejects invalid submissions without contacting the gateway", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ success: true }); };
  for (const body of [null, { ...data, email: "invalid" }, { ...data, formType: "volunteer", edad: 17 }, { ...data, cv: "file" }]) {
    assert.equal((await onRequest({ request: request(body), env })).status, 400);
  }
  assert.equal((await onRequest({ request: request({ ...data, nombre: "x".repeat(17000) }), env })).status, 413);
  assert.equal((await onRequest({ request: request(), env: { ...env, MAIL_GATEWAY_TOKEN: "" } })).status, 503);
  for (const attachment of [
    [{ name: "cv.pdf", content: "data:application/pdf;base64,SG9sYQ==" }],
    [{ name: "cv.exe", content: "SG9sYQ==" }],
    [{ name: "cv.pdf", content: "" }],
    [{ name: "cv.pdf", url: "https://example.com/cv.pdf" }],
    [{ name: "../cv.pdf", content: "SG9sYQ==" }],
    [{ name: "cv.pdf", content: btoa("x".repeat(5 * 1024 * 1024 + 1)) }],
    [{ name: "cv.pdf", content: "SG9sYQ==" }, { name: "cv2.pdf", content: "SG9sYQ==" }],
  ]) {
    assert.equal((await onRequest({ request: request({ ...data, formType: "volunteer", edad: 22, attachment }), env })).status, 400);
  }
  assert.equal((await onRequest({ request: request({ ...data, attachment: [{ name: "cv.pdf", content: "SG9sYQ==" }] }), env })).status, 400);
  assert.equal(calls, 0);
});

test("does not report gateway failures as successful submissions", async () => {
  for (const reply of [Response.json({ success: false }), Response.json({ success: true }, { status: 500 }), new Response("bad gateway")]) {
    globalThis.fetch = async () => reply;
    assert.equal((await onRequest({ request: request(), env })).status, 502);
  }
  globalThis.fetch = async () => { throw new Error("network error"); };
  assert.equal((await onRequest({ request: request(), env })).status, 502);
});

test("returns application errors without gateway diagnostics or secrets", async () => {
  for (const [status, code] of [[302, "GATEWAY_REDIRECT"], [401, "GATEWAY_AUTH_REJECTED"], [404, "GATEWAY_NOT_FOUND"], [429, "GATEWAY_RATE_LIMITED"], [500, "GATEWAY_REJECTED"]]) {
    globalThis.fetch = async () => new Response("private upstream details test-secret", { status });
    const response = await onRequest({ request: request(), env });
    assert.deepEqual(await response.json(), { success: false, code });
  }
  globalThis.fetch = async () => new Response("not JSON");
  assert.deepEqual(await (await onRequest({ request: request(), env })).json(), {
    success: false, code: "GATEWAY_INVALID_RESPONSE",
  });
  assert.deepEqual(await (await onRequest({ request: request(), env: { ...env, MAIL_GATEWAY_URL: "invalid" } })).json(), {
    success: false, code: "MAIL_URL_INVALID",
  });
});
