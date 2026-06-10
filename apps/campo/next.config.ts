import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ["@enjambre/auth", "@enjambre/ui"],
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
