// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Definimos la salida como servidor para que el adaptador de Cloudflare funcione
  output: 'server',
  
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: cloudflare({
    // Esto asegura que use la configuración de tu archivo wrangler.jsonc
    platformProxy: {
      enabled: true,
    },
  })
});