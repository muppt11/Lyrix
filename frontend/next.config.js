/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'api.lyralytics.com' },
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination:
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') +
          '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
