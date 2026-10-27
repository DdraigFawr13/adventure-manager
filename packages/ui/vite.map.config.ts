// The phone kingdom map (D-154, D-164, D-203) at /map.html: one JS and one CSS file beside the other
// pages in dist. Fonts are inlined by the asset limit, as in the other pages.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    cssCodeSplit: false,
    modulePreload: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: 'map.html',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'map.js',
        assetFileNames: 'map[extname]',
      },
    },
  },
});
