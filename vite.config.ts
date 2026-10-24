import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relative asset paths, so the build works under any sub-path — e.g. GitHub
  // Pages serves project sites from /<repo>/. Routing is hash-based, so no
  // server-side rewrites are needed.
  base: "./",
  plugins: [react(), tailwindcss()],
  server: { port: Number(process.env.PORT) || 5173 },
});
