/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Run on port 3001 to avoid conflict with backend
  async redirects() {
    return [];
  },
};

export default nextConfig;
