import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Explicitly disable Turbopack to ensure webpack is used
  // next-pwa requires webpack and doesn't work with Turbopack
  experimental: {
    turbo: false, // Disable Turbopack - next-pwa requires webpack
  },
  // Explicitly configure webpack to ensure next-pwa works correctly
  webpack: (config, { isServer }) => {
    // Ensure webpack is used (required for next-pwa)
    return config;
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'map-tiles',
        expiration: {
          maxEntries: 50, // Limit cache size
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'nominatim-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.osrm\.org\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'osrm-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
  fallbacks: {
    document: '/offline.html',
  },
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!noprecache/**/*'],
});

export default pwaConfig(nextConfig);
