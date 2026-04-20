/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@tripboard/shared", "@tripboard/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
