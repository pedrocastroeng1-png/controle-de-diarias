import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'prompt',
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          maximumFileSizeToCacheInBytes: 5000000
        },
        manifest: {
          short_name: "Diárias",
          name: "Controle de Diárias",
          description: "Sistema de controle de diárias, presença e ferramentas para obras.",
          categories: ["business", "productivity"],
          icons: [
            {
              src: "/icons/icon-72x72.png",
              type: "image/png",
              sizes: "72x72"
            },
            {
              src: "/icons/icon-96x96.png",
              type: "image/png",
              sizes: "96x96"
            },
            {
              src: "/icons/icon-128x128.png",
              type: "image/png",
              sizes: "128x128"
            },
            {
              src: "/icons/icon-144x144.png",
              type: "image/png",
              sizes: "144x144"
            },
            {
              src: "/icons/icon-152x152.png",
              type: "image/png",
              sizes: "152x152"
            },
            {
              src: "/icons/icon-180x180.png",
              type: "image/png",
              sizes: "180x180"
            },
            {
              src: "/icons/icon-192x192.png",
              type: "image/png",
              sizes: "192x192"
            },
            {
              src: "/icons/icon-384x384.png",
              type: "image/png",
              sizes: "384x384"
            },
            {
              src: "/icons/icon-512x512.png",
              type: "image/png",
              sizes: "512x512",
              purpose: "any maskable"
            }
          ],
          start_url: "/",
          background_color: "#FFFFFF",
          theme_color: "#2563EB",
          display: "standalone",
          orientation: "portrait"
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    define: {
      __BUILD_VERSION__: JSON.stringify(Date.now().toString())
    },
    build: { chunkSizeWarningLimit: 3000 }
  };
});
