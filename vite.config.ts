import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // No service worker — just inject the web app manifest
      // so browsers show the "Add to Home Screen" / install prompt.
      registerType: 'prompt',
      injectRegister: false,
      selfDestroying: true,
      manifest: {
        name: 'Particle Architect | Professional 3D Particle Simulator',
        short_name: 'Particle Architect',
        description: 'A high-performance WebGL simulation platform for creative computational artists. Generate, save, and publish massive 3D particle swarms using neural navigation and custom AI logic.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          ui: ['lucide-react', 'zustand']
        }
      }
    }
  },
})
