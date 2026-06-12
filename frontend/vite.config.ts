import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()], // Tailwind v4 — no config file, tokens live in styles.css @theme
  server: {
    // All API calls go through the dev proxy — no CORS surface anywhere.
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
});
