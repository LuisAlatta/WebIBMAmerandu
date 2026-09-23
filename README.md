# Amerandú

> Club de lectura y pensamiento latinoamericano.

Sitio web de **Amerandú**, un espacio para leer, dialogar y reflexionar sobre las ideas, la literatura y las culturas de América Latina.

## Características

- Landing de una sola página con secciones de presentación, misión y visión, valores y club de lectura.
- Sección de preguntas frecuentes (FAQ) interactiva.
- Formulario de contacto y voluntariado integrado con mail-gateway y CV opcional.
- Botón directo de WhatsApp.
- Página de políticas de privacidad.
- Diseño responsive y optimizado para SEO.

## Tecnologías

| Herramienta | Uso |
| :--- | :--- |
| [Astro](https://astro.build) | Framework principal del sitio |
| [React](https://react.dev) | Componentes interactivos (formularios, FAQ, menú) |
| [Tailwind CSS](https://tailwindcss.com) | Estilos |
| [React Hook Form](https://react-hook-form.com) | Manejo de formularios |
| [Lucide](https://lucide.dev) | Iconos |
| [Cloudflare](https://developers.cloudflare.com/pages/) | Despliegue |

## Requisitos

- Node.js `>=22.12.0`

## Instalación

```sh
npm install
```

## Comandos

Todos se ejecutan desde la raíz del proyecto:

| Comando | Acción |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run build` | Compila el sitio de producción en `./dist/` |
| `npm run preview` | Previsualiza la compilación localmente |
| `npm run preview:cloudflare` | Sirve `dist/` y la API de correo con Wrangler |
| `npm test` | Ejecuta las pruebas existentes de la API con respuestas simuladas |
| `npm run astro ...` | Ejecuta comandos del CLI de Astro |

## Estructura

```text
amerandu-web/
├── public/              # Imágenes y assets estáticos
├── src/
│   ├── components/      # Componentes .astro y .tsx (Hero, About, FAQ, ContactForm...)
│   ├── layouts/         # Layout base con metadatos y SEO
│   ├── pages/           # Rutas: index y políticas de privacidad
│   └── styles/          # Estilos globales
└── package.json
```

## Despliegue

El proyecto está preparado para desplegarse en **Cloudflare**. La compilación de producción se genera con `npm run build` y se sirve el contenido de `./dist/`.

### Correo del formulario

El formulario llama a `/api/contact`, implementado como Pages Function en
`functions/api/contact.ts`. Esta función envía el correo mediante `POST /send`
del mail-gateway. El token permanece en el servidor. Los destinatarios activos son
`ameranduclub@gmail.com` y `newluisalatta@gmail.com`, definidos en el campo `to` de la función; el email del solicitante
se incluye en el contenido y en `replyTo` para responder directamente al solicitante.

Configura en `.env` las variables de `.env.example`: `MAIL_GATEWAY_URL`
(URL base o URL terminada en `/send`), `MAIL_GATEWAY_TOKEN` y
`MAIL_GATEWAY_FROM` (remitente autorizado por el gateway).
Para probar el formulario localmente:

```sh
npm run build
npm run preview:cloudflare
```

Wrangler carga `.env`; si existe `.dev.vars`, este tiene prioridad.
`npm run dev` y `npm run preview` ejecutan solo Astro, sin Pages Functions.
En Cloudflare Pages configura las mismas variables para producción y preview,
guardando el token como secreto, y vuelve a desplegar. Despliega mediante la
integración Git de Pages o `wrangler pages deploy dist` desde la raíz del proyecto
para incluir `functions/`; subir solo los archivos estáticos no incluye la API.

El voluntariado permite adjuntar un CV PDF, DOC o DOCX de hasta 5 MB. Se convierte
a base64 puro y se envía en `attachment`, dentro del JSON. El servidor valida
cantidad, nombre/extensión, codificación y tamaño; no almacena el archivo.
`MAIL_GATEWAY_TOKEN` es el token del proyecto registrado en KV, no la API key de Brevo.

## Guía de mantenimiento

Consulta [docs/arquitectura.md](docs/arquitectura.md) para conocer los archivos
compartidos, la navegación por pestañas, las animaciones y el flujo de correo.
