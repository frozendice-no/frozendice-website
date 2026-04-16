import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async redirects() {
    // 301 redirect mapping for existing Wix URLs.
    // Add entries here as: { source, destination, permanent: true }
    return [
      // Example:
      // { source: "/home", destination: "/", permanent: true },
      // { source: "/my-blog/:slug", destination: "/blog/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
