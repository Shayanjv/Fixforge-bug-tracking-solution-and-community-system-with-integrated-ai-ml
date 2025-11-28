import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      '@radix-ui/react-avatar',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      '@radix-ui/react-label',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-alert-dialog',
      'lucide-react',
      'class-variance-authority',
    ],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://shy6565-fixforge-backend.hf.space
",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
