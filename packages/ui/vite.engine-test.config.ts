// The engine-test build (D-110): a normal multi-file build the Electron shell loads from disk.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-engine-test',
    emptyOutDir: true,
    rollupOptions: { input: 'engine-test.html' },
  },
});
