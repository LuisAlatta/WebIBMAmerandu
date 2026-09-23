import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Astro genera HTML estático. La API se despliega aparte desde functions/ como
// Pages Functions; no requiere habilitar SSR ni el adaptador de Astro/Cloudflare.
export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});
