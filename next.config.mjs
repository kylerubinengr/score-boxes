/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
      },
      {
        protocol: 'https',
        hostname: 'static.www.nfl.com',
      },
    ],
  },
  // Required for next/jest to transpile ESM packages used by MSW in tests
  transpilePackages: ['msw', '@mswjs/interceptors', 'until-async', '@open-draft/until', 'strict-event-emitter'],
};

export default nextConfig;
