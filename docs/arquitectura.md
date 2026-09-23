# Guía de los archivos compartidos

## Cómo se compone el sitio

`src/pages/index.astro` define el orden de las secciones. `src/layouts/Layout.astro`
aporta metadatos, estilos globales, el script de movimiento y el cambio de fondo
de la barra al hacer scroll. Astro genera HTML estático en `dist/`.

Las islas React añaden interacción: `MobileMenu.tsx`, `FAQ.tsx` y
`ContactForm.tsx`. La API vive fuera de `src/pages`, en `functions/api/contact.ts`;
Cloudflare Pages la despliega junto al sitio. No se usan Astro Actions ni SSR.

## Archivos que conviene conocer

| Archivo | Responsabilidad y punto de edición |
| --- | --- |
| `src/data/navigation.ts` | Enlaces compartidos por Navbar y MobileMenu, y estilos de sus botones. Modificar aquí para mantener ambas navegaciones alineadas. |
| `src/scripts/motion.ts` | Entradas al viewport, secuencias y paralaje. Los selectores `group()` deben coincidir con las clases de los componentes. |
| `src/styles/motion.css` | Estados y microinteracciones: hover, luz sobre las fotos, agradecimiento y movimiento reducido. |
| `src/styles/landing-sections.css` | Colores, anchos, títulos y separadores compartidos entre secciones. Los estilos propios permanecen en cada `.astro`. |
| `src/components/ContactForm.tsx` | Campos, pestañas, teléfono internacional, validación, envío y mensajes de resultado. |
| `functions/api/contact.ts` | Validación del servidor y envío autenticado al gateway. Aquí se editan destinatarios y campos incluidos en el correo. |
| `src/server/contact-email.ts` | Plantilla HTML del correo con estilos inline, datos escapados y botón para responder al solicitante. Se importa solo desde la función. |
| `src/components/MobileMenu.tsx` | Modal nativo, bloqueo de scroll y cierre al pasar a escritorio. Su breakpoint debe coincidir con Navbar. |
| `src/components/FAQ.tsx` | Estado y accesibilidad del acordeón. La animación de altura está en `FAQSection.astro`. |
| `src/components/Button.astro` | Enlace CTA compartido con variantes principal/secundaria y tamaño compacto. |
| `src/components/MediaButton.astro` | Enlace a Spotify/YouTube; sin href muestra un botón deshabilitado. |
| `src/components/SpotifyEmbed.astro` | Iframe del episodio de Spotify. Los controles interiores pertenecen a Spotify y no se estilizan desde esta web. |
| `src/components/WaveDivider.astro` | Siluetas SVG entre secciones. `fillColor` debe empatar con el fondo de la sección siguiente. |
| `src/components/SectionLeaves.astro` | Motivo vegetal opcional que hereda color y clases del contenedor. Su existencia no implica que esté usado en la portada actual. |

## Enlaces que abren el formulario

`/#contact-tab-club` y `/#contact-tab-volunteer` no son páginas independientes:
apuntan a las pestañas del formulario. El prefijo `/` permite volver desde la página
legal. ContactForm lee el hash al hidratarse y escucha cambios y clics repetidos.
No permite cambiar de pestaña durante un envío. Si se renombran estos identificadores,
actualizar `navigation.ts`, los CTA y la lógica de ContactForm juntos.

## Movimiento

`group(selector, kind, step)` registra entradas de tipo `up`, `side`, `scale` o
`fade`. `step` es el retraso por elemento en milisegundos, limitado a 330 ms en
los grupos. El orden sigue el DOM. Cada elemento deja de observarse al entrar:
no se vuelve a ocultar cuando el usuario retrocede en la página.

Se guarda la opacidad calculada antes de ocultar el elemento para conservar la
transparencia de las decoraciones. `fill: backwards` cubre el retraso sin mantener
transformaciones al finalizar, lo que permite que el hover actúe normalmente.
Las fotos son collages completos; el resplandor es decorativo, no actividad real.

El paralaje escribe `--parallax-y`, limitado entre -32 y 64 px. Solo se actualiza
con el héroe visible y mediante `requestAnimationFrame`. El margen de la imagen
en CSS evita que aparezcan bordes descubiertos.

Sin JavaScript, el contenido permanece visible. Con movimiento reducido no se
registran entradas; si se activa durante la visita, se cancelan las animaciones
y se revela el contenido pendiente. Foco e impresión también fuerzan visibilidad.
El formulario anima el contenedor `astro-island`, que persiste tras la hidratación.

## Envío de correo

Flujo: **ContactForm → POST /api/contact → POST /send del gateway → Brevo**.

- El navegador manda tipo de formulario, nombre, email, país y teléfono; en
  voluntariado añade edad y experiencia. Nunca recibe la credencial del gateway.
- La función acepta JSON de hasta 16 KiB, valida campos y escapa el texto que
  se inserta en HTML. El remitente se obtiene de `MAIL_GATEWAY_FROM`.
- Los destinatarios activos son `ameranduclub@gmail.com` y `newluisalatta@gmail.com`.
  Se cambian en `to` dentro de la función, no en `.env`.
- El contrato actual no incluye adjuntos ni `replyTo`: el CV no se envía y el
  email del solicitante aparece en el cuerpo. No cambiar el remitente por el
  email del visitante: Brevo debe autorizar la dirección remitente.
- La función espera hasta 25 segundos; el navegador espera 30. No hay reintentos
  automáticos, para evitar duplicados cuando un envío se acepta pero se pierde la respuesta.
- Se devuelven códigos de aplicación, sin logs de debug, token ni respuesta cruda
  del proveedor. Un estado 502 agrupa fallos del gateway: el campo `code` distingue
  autorización, URL de destino no encontrada, redirección, límite, respuesta inválida,
  conexión o timeout. Un 503 señala configuración local incompleta o URL inválida.

`.env.example` enumera las variables. En local Wrangler carga `.env` (o `.dev.vars`,
que tiene prioridad); en Cloudflare hay que definirlas para cada entorno utilizado.
`astro dev` no ejecuta `functions/`: para probar correos usar `npm run build` y
`npm run preview:cloudflare`. La fecha de compatibilidad fijada en ese script evita
que el motor local solicite automáticamente una fecha posterior a la que soporta.

`tests/contact.test.mjs` usa `node:test` y sustituye `fetch` por respuestas simuladas:
no manda correos reales. `npm test` habilita la eliminación de tipos de Node para
importar la función TypeScript. No requiere Bun.
