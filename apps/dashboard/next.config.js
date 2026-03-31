/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone',
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source:      '/api/elorge/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/:path*`,
      },
    ];
  },

  env: {
    NEXT_PUBLIC_API_URL:       process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    NEXT_PUBLIC_PLATFORM_NAME: 'Elorge Technologies',
  },
};

module.exports = nextConfig;