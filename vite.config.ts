import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages hosts this repository at /hush-companion/.
  base: '/hush-companion/',
  plugins: [react()],
});
