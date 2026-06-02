import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tells Next.js to isolate these heavy Node modules away from the server bundles
  serverExternalPackages: ["mongoose", "@xenova/transformers"],

  // 🛠 SILENCE TURBOPACK WARNINGS & CONFLICTS
  transpilePackages: ["@xenova/transformers"],

  experimental: {
    // Tells the Vercel tracer exactly where to copy the dependency assets safely
    outputFileTracingIncludes: {
      '/api//*': ['./node_modules/@xenova/transformers//*']
    }
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Force webpack to completely ignore compiling or referencing the missing C++ bindings
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
      { protocol: "https", hostname: "share.google", pathname: "/" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/" },
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
