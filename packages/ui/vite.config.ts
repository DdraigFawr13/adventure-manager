// The step 4 prototype at the root of the Vercel link (D-200): one JS and one CSS file, with the
// fonts as separate WOFF2 files so the CSS stays small and phones cache them across deploys.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    modulePreload: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: (asset) =>
          asset.names.some((n) => n.endsWith('.css'))
            ? 'app[extname]'
            : 'fonts/[name]-[hash][extname]',
      },
    },
  },
});
