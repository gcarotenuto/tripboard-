/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@tripboard/shared", "@tripboard/ui", "@tripboard/parsing"],
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
