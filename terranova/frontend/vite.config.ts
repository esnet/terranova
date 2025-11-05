import { defineConfig, loadEnv } from "vite";
import tailwindcss from '@tailwindcss/vite';
import react from "@vitejs/plugin-react";
import { fileURLToPath } from 'node:url';

var settingsPath = 'static/settings.js';
var settingsURL = fileURLToPath(new URL(settingsPath, import.meta.url));
console.log("Building with external settings module with relative path: ", settingsPath);

// https://vitejs.dev/config/
export default ({ mode }) => {
    process.env = {...process.env, ...loadEnv(mode, process.cwd())};

    // import.meta.env.VITE_NAME available here with: process.env.VITE_NAME
    // import.meta.env.VITE_PORT available here with: process.env.VITE_PORT

    return defineConfig({
      plugins: [react(), tailwindcss()],
      build: {
          sourcemap: true,
          outDir: "./dist",
          rollupOptions: {
              external: [
                "/static/d3.min.js",
                "d3.min.js",
                settingsURL,
              ]
          }
      },
    });
}
