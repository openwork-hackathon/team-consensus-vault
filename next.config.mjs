/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  env: {
    // AI model proxy URL — routes AI API calls through our server which holds the keys.
    // Falls back to direct calls when not set (local dev with keys in .env.local).
    // NOTE: Empty string explicitly DISABLES the proxy. Only use fallback if truly undefined.
    AI_PROXY_URL: process.env.AI_PROXY_URL !== undefined
      ? process.env.AI_PROXY_URL
      : 'https://haywood-mitigable-kinsley.ngrok-free.dev',
  },
  reactStrictMode: true,
  transpilePackages: ['framer-motion'],
  experimental: {
    optimizePackageImports: ['@rainbow-me/rainbowkit', 'recharts'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  poweredByHeader: false,

  // Compiler options for better performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|ico|webp|avif)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
