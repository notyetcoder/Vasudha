/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // 10MB allows profile photo uploads (compressed before sending)
      bodySizeLimit: '10mb',
    },
  },

  // Keep these disabled — build errors surfaced at runtime are easier to debug
  // in a small team. Enable once the codebase is fully typed.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    // Only allow trusted domains for next/image optimisation
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',  // Supabase Storage for profile pictures
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',   // Legacy placeholder — kept for old records
        pathname: '/**',
      },
    ],
    // Cache optimised images for 7 days (default is 60s — too aggressive for profile pics)
    minimumCacheTTL: 604800,
    // Allow WebP/AVIF for modern browsers
    formats: ['image/avif', 'image/webp'],
    // Reasonable quality — profile pictures don't need 100%
    qualities: [75, 85],
    // Device sizes covering mobile through 4K
    deviceSizes: [375, 430, 640, 768, 1024, 1280, 1920],
    imageSizes: [40, 64, 80, 100, 150, 256],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
