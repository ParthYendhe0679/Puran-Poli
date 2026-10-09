import type { NextConfig } from "next";

// Frontend-only prototype: no API routes, no server actions, no backend services.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // A stray lockfile in the user's home folder confuses root detection; pin it to this project.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
