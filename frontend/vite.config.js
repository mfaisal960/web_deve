import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load every var (not just VITE_*) so the dev-only HTTPS flag stays server-side.
  const env = loadEnv(mode, process.cwd(), "");

  // Stripe.js only refuses to run a pk_live_ key over http://. Since the local
  // key is pk_test_, keep the dev server on plain http and avoid the
  // self-signed-cert warning entirely. Opt in with VITE_DEV_HTTPS=true.
  const useHttps = env.VITE_DEV_HTTPS === "true";

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(useHttps ? [basicSsl({ name: "localhost" })] : []),
    ],
    server: {
      host: "localhost",
      ...(useHttps ? { https: true } : {}),
    },
  };
});
