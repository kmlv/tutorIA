import { resolve } from "node:path";
import { defineConfig } from "vite";

// The browser NEVER talks to the LLM provider: everything goes through the server
// (decision 20). In production this dev server does not exist — the front-end is built
// to static files and FastAPI serves them, so there is one process instead of two.
//
// The port comes from PORT when the harness assigns one, so the preview tooling can
// pick a free port instead of colliding on a hardcoded 5173.
export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/media": "http://127.0.0.1:8000",
    },
  },
  // Dos entradas. `laminas.html` es el prototipo de T-013 y vive aparte a propósito: la
  // lección de hoy no se toca, así que si la hipótesis sale mal se borra un directorio.
  build: {
    target: "es2017",
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        laminas: resolve(__dirname, "laminas.html"),
      },
    },
  },
});
