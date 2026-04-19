import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async redirects() {
    // Post-migration: categories were merged into tags. Redirect old URLs.
    return [
      {
        source: "/blog/category/:category",
        destination: "/blog/tag/:category",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
