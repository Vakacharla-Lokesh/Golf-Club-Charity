import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Use standalone output for production - all routes rendered on-demand
  output: 'standalone',
};

export default nextConfig;
