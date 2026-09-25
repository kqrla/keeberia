import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// plain vite config — no platform wrapper. the shell owns its own build now.
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    react(),
    tailwindcss(),
    // redirect the bundled server entry to our SSR error wrapper (src/server.ts)
    tanstackStart({ server: { entry: "src/server.ts" } }),
  ],
});
