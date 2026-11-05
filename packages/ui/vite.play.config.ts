// The gate 1 play page (gate 1 spec, UI) at /play.html: one JS and one CSS file beside the other
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
      input: 'play.html',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'play.js',
        assetFileNames: 'play[extname]',
      },
    },
  },
});
