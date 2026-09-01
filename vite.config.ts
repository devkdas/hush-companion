import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages hosts this repository at /hush-companion/.
  base: process.env.NODE_ENV === 'production' ? '/hush-companion/' : '/',
  plugins: [react()],
});
