import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths so it works in any subfolder or domain
  build: {
    outDir: '../f1',
    emptyOutDir: true
  }
});
