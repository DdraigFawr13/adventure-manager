// The R1 Quest Watch, moved aside to /quest-watch.html (D-200): one JS and one CSS file beside the
// step 4 page in dist, so tools/build-prototype.mjs can still inline them into a single page.
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
      input: 'quest-watch.html',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'quest-watch.js',
        assetFileNames: 'quest-watch[extname]',
      },
    },
  },
});
