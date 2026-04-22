const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@tripboard/shared", "@tripboard/ui", "@tripboard/parsing"],
  webpack: (config) => {
    // tesseract.js uses native binaries incompatible with Vercel/Edge.
    // Replace with a no-op stub so the parsing package can be transpiled.
    config.resolve.alias["tesseract.js"] = path.resolve(
      __dirname,
      "./src/lib/tesseract-stub.js"
    );
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {},
};

module.exports = nextConfig;
