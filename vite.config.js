import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",  // /src/main.jsx</script>
  preview: {
    allowedHosts: [
      'thelegacytrustgenerator-app.onrender.com',
      'thelegacytrustgenerator.app',
      'www.thelegacytrustgenerator.app',
      'living-trust-web.onrender.com'
    ]
  }
});
