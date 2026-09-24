import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Let ngrok tunnels reach the dev/preview server (leading dot = any subdomain).
  server: { allowedHosts: [".ngrok-free.app"] },
  preview: { allowedHosts: [".ngrok-free.app"] },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/polyfills.ts", "./src/test/setup.ts"],
    css: false,
  },
});
