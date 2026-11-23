/**
 * Configuration de Vite (outil de build) et du plugin PWA.
 *
 * - `base` : chemin public de l'application. Vaut "/" en local et
 *   "/app_glacier/" sur GitHub Pages (variable BASE_PATH définie par la CI).
 * - Le plugin PWA génère le manifeste et le service worker, ce qui rend
 *   l'application installable et utilisable hors ligne.
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import paquet from './package.json' with { type: 'json' };

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  // Version affichée dans la page Paramètres.
  define: { __VERSION_APP__: JSON.stringify(paquet.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Enregistrement fait dans src/lib/miseAJour.ts (vérifications régulières).
      injectRegister: false,
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gestion glacier',
        short_name: 'Glacier',
        description: 'Plannings, stocks et employés du glacier.',
        lang: 'fr',
        theme_color: '#e85d75',
        background_color: '#fff8f3',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
