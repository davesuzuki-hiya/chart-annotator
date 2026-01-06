import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves your app from a sub-path: /<repo-name>/
// This must match your repository name.
export default defineConfig({
  plugins: [react()],
  base: '/chart-annotator/',
});
