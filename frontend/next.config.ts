import type { NextConfig } from 'next';

// Build the list of allowed origins for Server Actions.
// In production this should include your Vercel domain and any preview patterns.
const allowedOrigins = (() => {
  const origins = ['localhost:3000', 'localhost:3001'];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    // Strip protocol so Next.js can match host:port form
    origins.push(appUrl.replace(/^https?:\/\//, ''));
  }
  return origins;
})();

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
