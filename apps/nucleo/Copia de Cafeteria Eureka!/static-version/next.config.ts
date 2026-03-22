import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    forceSwcTransforms: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
