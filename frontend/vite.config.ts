import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 5174,
    open: true,
    host: true
  },
  plugins: [
    react(),
  ],
  preview: {
    port: 4174,
    host: true
  }
});
