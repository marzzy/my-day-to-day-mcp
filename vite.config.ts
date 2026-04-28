import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "src/index.ts",
    target: "node22",
    outDir: "dist",
    rollupOptions: {
      output: {
        entryFileNames: "index.js",
      },
    },
  },
});
