import { defineConfig } from "vite";

// El navegador NUNCA habla con el proveedor LLM: todo pasa por el servidor (decisión 20).
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/media": "http://127.0.0.1:8000",
    },
  },
  build: { target: "es2017", outDir: "dist" },
});
