/**
 * Plantilla HTML del correo interno de contacto. Solo se importa desde el servidor.
 * Tablas y estilos inline mantienen el diseño legible en clientes de correo;
 * no depende de Tailwind, fuentes remotas, imágenes ni JavaScript.
 */
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => (
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!
));

export function renderContactEmail(fields: string[][], interest: string, email: string) {
  const rows = fields.map(([label, value]) => `
    <tr><td style="padding:16px 0;border-bottom:1px solid #e6ece8;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:bold;letter-spacing:0.6px;color:#52675e;">${escapeHtml(label)}</p>
      <p style="margin:0;font-size:16px;line-height:1.6;color:#1a1a1a;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(value).replace(/\r\n|\r|\n/g, "<br />")}</p>
    </td></tr>`).join("");
  const replyUrl = escapeHtml(`mailto:${encodeURIComponent(email)}`);

  return `<!doctype html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Nuevo contacto de Amerandú</title></head>
<body style="margin:0;padding:0;background-color:#fff5dd;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff5dd;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e6ece8;border-radius:16px;">
        <tr><td style="padding:28px 24px;background-color:#055b3d;border-radius:16px 16px 0 0;">
          <p style="margin:0 0 12px;font-size:13px;letter-spacing:2px;font-weight:bold;color:#fbdb95;">AMERANDÚ</p>
          <h1 style="margin:0;font-size:25px;line-height:1.3;color:#ffffff;">Nueva solicitud de contacto</h1>
          <p style="margin:12px 0 0;font-size:16px;line-height:1.5;color:#ffffff;">${escapeHtml(interest)}</p>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#52675e;">Una persona completó el formulario de la web. Estos son sus datos:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;">${rows}</table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr><td bgcolor="#055b3d" style="border-radius:8px;text-align:center;">
              <a href="${replyUrl}" style="display:inline-block;padding:14px 22px;border:1px solid #055b3d;border-radius:8px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;line-height:1.4;">Responder a la persona</a>
            </td></tr>
          </table>
          <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#52675e;">Usa el botón o escribe al email indicado arriba. Esta notificación se envía desde el correo de Amerandú.</p>
        </td></tr>
        <tr><td style="padding:18px 24px;border-top:1px solid #e6ece8;background-color:#f6faf8;border-radius:0 0 16px 16px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#52675e;">Amerandú · Club de lectura y pensamiento latinoamericano<br />Notificación automática del formulario web.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
