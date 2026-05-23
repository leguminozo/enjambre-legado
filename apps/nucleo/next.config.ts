import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@enjambre/ui",
    "@enjambre/auth",
    "@enjambre/maps",
    "@enjambre/contable",
    "@enjambre/banco-chile",
    "@enjambre/sumup",
  ],
  serverExternalPackages: ["gsap", "meyda", "sharp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
