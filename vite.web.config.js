// Web-only build of the renderer (used for the Vercel demo).
// The desktop app is still built with electron-vite (npm run build / npm run dist).
import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: resolve(__dirname, "src/renderer"),
  base: "/",
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "dist-web"),
    emptyOutDir: true
  }
});
