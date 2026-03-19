import { defineConfig } from 'vite';
import { resolve } from 'path';

const root = resolve(__dirname, 'src');

// Web-only build — Electron plugin YOK
export default defineConfig({
  root,
  base: './',
  publicDir: resolve(root, 'assets'),
  build: {
    outDir: resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
    // Mobil için küçük chunk'lar — ilk yükleme daha hızlı
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: resolve(root, 'index.web.html'),
      output: {
        // Phaser büyük olduğu için ayrı chunk'a al; oyun kodu ayrı
        manualChunks: (id: string) => {
          if (id.includes('node_modules/phaser')) return 'phaser';
        }
      }
    }
  },
  resolve: {
    alias: { '@': root }
  },
  server: {
    port: 3001,
    host: true // LAN erişimi (telefon test için)
  }
});
