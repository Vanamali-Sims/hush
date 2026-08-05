import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // maplibre-gl ships a web worker that the Vite dep optimizer mishandles,
  // producing a "maplibre-gl-worker.mjs does not exist" error. Excluding it
  // from pre-bundling is the documented fix.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
});
