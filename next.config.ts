import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: 'avatars.githubusercontent.com',
        protocol: 'https',
      },
      {
        hostname: '*.googleusercontent.com',
        protocol: 'https',
      },
      {
        hostname: 'avatar.vercel.sh',
        protocol: 'https',
      },
      {
        hostname: '*.backblazeb2.com',
        protocol: 'https',
      },
    ],
  },
};

export default nextConfig;
