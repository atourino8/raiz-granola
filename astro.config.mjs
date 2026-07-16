// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Nunca incrustar scripts inline: la CSP (script-src 'self') los bloquearía.
      assetsInlineLimit: 0,
    },
  },
  server: { port: 4321 },
});