# Amerandú

Sitio web de un club de lectura y pensamiento latinoamericano, construido con
**Astro, React y Tailwind CSS** y desplegado en **Cloudflare Pages**.

Las páginas son estáticas. React aporta el menú, las preguntas frecuentes y el
formulario; una Pages Function procesa el envío de correo sin exponer el token.
Las animaciones respetan la preferencia de movimiento reducido.

## Desarrollo

Requiere **Node.js >=22.12.0**.

```sh
npm install
npm run dev
```

| Comando | Uso |
| --- | --- |
| `npm run dev` | Desarrollo de la interfaz en `localhost:4321` |
| `npm run build` | Genera el sitio en `dist/` |
| `npm run preview` | Previsualiza el sitio estático |
| `npm run preview:cloudflare` | Sirve `dist/` junto con la función de correo |
| `npm test` | Pruebas de la API con respuestas simuladas, sin enviar correos |

## Formulario y variables

Copia `.env.example` a `.env` y completa:

- `MAIL_GATEWAY_URL`: URL del gateway, base o terminada en `/send`.
- `MAIL_GATEWAY_TOKEN`: token del proyecto del gateway, no la API key de Brevo.
- `MAIL_GATEWAY_FROM`: remitente autorizado por el gateway y el proveedor de correo.

Para probar el envío localmente:

```sh
npm run build
npm run preview:cloudflare
```

Los comandos de Astro por sí solos no ejecutan `/api/contact`. Wrangler carga
`.env`; si existe `.dev.vars`, este tiene prioridad. El comando de preview de
Cloudflare activa `MAIL_ENV=local` para usar el destinatario de pruebas.

El formulario de voluntariado admite un CV opcional PDF, DOC o DOCX de hasta
5 MB. Los archivos se validan y se envían adjuntos; no se almacenan en el sitio.

## Organización

- `src/pages/` y `src/components/`: páginas y componentes de la interfaz.
- `src/data/navigation.ts`: enlaces compartidos entre los menús; los hashes de
  participación también seleccionan la pestaña del formulario.
- `src/scripts/motion.ts` y `src/styles/motion.css`: entradas, paralaje y
  microinteracciones. Sus selectores deben mantenerse alineados con los componentes.
- `src/server/contact-email.ts`: plantilla HTML del correo.
- `functions/api/contact.ts`: validación, destinatarios por entorno y llamada al gateway.

## Despliegue

Cloudflare Pages está vinculado al repositorio. Usa `npm run build` como comando
de compilación y `dist` como directorio de salida; `functions/` contiene la API.

Configura las variables anteriores en Cloudflare para los entornos utilizados,
guardando el token como secreto. En producción no configures `MAIL_ENV=local`.
Vuelve a desplegar después de cambiar variables. `.env` y `.dev.vars` son locales
y están excluidos de Git.
