import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// QUITAMOS el adaptador de Cloudflare por ahora
export default defineConfig({
  output: 'static', // Cambiamos a static
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});