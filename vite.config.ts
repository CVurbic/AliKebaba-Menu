import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  assetsInclude: ['**/*.svg'],
  build: {
    rollupOptions: {
      plugins: [
        {
          name: 'raw-svg',
          transform(code, id) {
            if (id.endsWith('.svg?raw')) {
              return {
                code: `export default ${JSON.stringify(code)}`,
                map: null
              }
            }
          }
        }
      ]
    }
  }
});
