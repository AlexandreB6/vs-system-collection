import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "img.ccgdb.com",
        pathname: "/vs/**",
      },
    ],
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
