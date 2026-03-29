import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',           // for Docker container deployment
  reactStrictMode: true,

  // Proxy API calls to avoid CORS in development
  async rewrites() {
    return [
      {
        source:      '/api/elorge/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/:path*`,
      },
    ];
  },

  // Expose only safe env vars to the browser
  env: {
    NEXT_PUBLIC_API_URL:      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    NEXT_PUBLIC_PLATFORM_NAME: 'Elorge Technologies',
  },
};

export default nextConfig;
