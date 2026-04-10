import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  },
  adapter: cloudflare({
    // Desactivamos todo lo que genera conflictos de nombres
    platformProxy: {
      enabled: false
    },
    // Evita que intente usar Cloudflare Images
    imageService: 'passthrough'
  })
});