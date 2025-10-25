import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// HTTPS certificate configuration for HashPack compatibility
const getHttpsConfig = () => {
  const certDir = path.resolve(__dirname, 'cert');
  const keyPath = path.join(certDir, 'localhost.key');
  const certPath = path.join(certDir, 'localhost.crt');
  
  // Check if custom certificates exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('🔒 Using custom SSL certificates for HTTPS');
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
  }
  
  // Use Vite's built-in self-signed certificate
  console.log('🔒 Using Vite self-signed certificate for HTTPS');
  return true;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 5173,
    https: getHttpsConfig(), // Enable HTTPS with certificate handling
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep SVG files in root for easier access
          if (assetInfo.name && assetInfo.name.endsWith('.svg')) {
            return '[name].[hash].[ext]';
          }
          return 'assets/[name].[hash].[ext]';
        },
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
  optimizeDeps: {
    include: ['@hashgraph/hashconnect', 'long'],
  },
  base: '/',
}));
