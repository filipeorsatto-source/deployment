import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" => caminhos relativos, funciona no GitHub Pages, Vercel e Netlify.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
