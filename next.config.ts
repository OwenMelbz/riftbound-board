import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cmsassets.rgpub.io",
        pathname: "/sanity/images/**",
      },
    ],
  },
};

export default nextConfig;
