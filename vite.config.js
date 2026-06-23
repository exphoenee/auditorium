import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: '/auditorium/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
