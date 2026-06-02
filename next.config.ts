import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Modern Next.js way to tell the serverless builder to leave these alone
  serverExternalPackages: ["mongoose", "@xenova/transformers"],

  experimental: {
    // 2. Extra layer of safety for server trace bundles
    outputFileTracingIncludes: {
      '/api//*': ['./node_modules/@xenova/transformers//*']
    }
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // 3. Force webpack to completely ignore resolving the native binary paths
      config.externals = [...(config.externals || []), {
        "onnxruntime-node": "commonjs onnxruntime-node",
        "sharp": "commonjs sharp",
      }];
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },

  images: {
    qualities: [100, 75],
    remotePatterns: [
      { protocol: "https", hostname: "share.google", pathname: "" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "" },
      { protocol: "https", hostname: "visitethiopia.et", pathname: "/" },
      { protocol: "https", hostname: "whc.unesco.org", pathname: "/" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }
    ],
  },

  async rewrites() {
    return [
      {
        source: "/unesco-assets/:path*",
        destination: "https://whc.unesco.org/:path*",
      },
    ];
  },
};

export default nextConfig;
