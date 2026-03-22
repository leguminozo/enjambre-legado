import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@enjambre/ui", "@enjambre/auth", "@enjambre/maps"],
};

export default nextConfig;
