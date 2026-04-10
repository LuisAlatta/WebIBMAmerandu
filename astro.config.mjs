import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server', // Esto es muy importante
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  },
  adapter: cloudflare()
});