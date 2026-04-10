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
    // IMPORTANTE: Desactivamos esto por ahora para evitar conflictos de nombres reservados
    imageService: 'passthrough' 
  })
});