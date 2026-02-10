import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "LinguaLens",
    description:
      "Learn languages by clicking subtitles on streaming sites — powered by in-browser AI",
    permissions: ["activeTab", "offscreen", "storage"],
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; worker-src 'self';",
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
