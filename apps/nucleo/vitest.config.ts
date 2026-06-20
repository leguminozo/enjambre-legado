import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    exclude: ["e2e/**", "node_modules/**"],
    globals: true,
    environment: "node",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://mock.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "mock-service-role-key",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
