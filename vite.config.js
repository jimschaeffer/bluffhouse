import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Local dev convenience: proxy the shared-state API to the deployed Netlify function
  // so `npm run dev` exercises the real backend.
  server: {
    proxy: {
      "/api": {
        target: "https://bluff-house-social.netlify.app",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
