// Builds the <artist-epk> web component for GoDaddy: dist-embed/artist-epk.js (+ lazy chunks).
// Host the whole dist-embed folder on any HTTPS static host and load artist-epk.js as a module.
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Library mode doesn't replace this by default; React needs it for its production build.
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  publicDir: "embed-public",
  build: {
    outDir: "dist-embed",
    emptyOutDir: true,
    lib: {
      entry: "src/embed/index.tsx",
      formats: ["es"],
      fileName: () => "artist-epk.js",
    },
    // Library mode skips whitespace minification for ES output; this is a script tag, not a package.
    rolldownOptions: { output: { minify: true } },
  },
});
