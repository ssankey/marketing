// // next.config.cjs
// module.exports = {
//   experimental: {
//     appDir: true,
//   },
//   webpack: (config, { isServer }) => {
//     if (!isServer) {
//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         dns: false,
//         net: false,
//         tls: false,
//         fs: false,
//       };
//     }
//     return config;
//   },
//   trailingSlash: false,
//   async rewrites() {
//     return [
//       {
//         source: "/.well-known/pki-validation/:file",
//         destination: "/api/well-known/pki-validation/:file",
//       },
//     ];
//   },
// };

// next.config.cjs
module.exports = {
  experimental: {
    appDir: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
      };
    }
    return config;
  },
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: "/.well-known/pki-validation/:file",
        destination: "/api/well-known/pki-validation/:file",
      },
    ];
  },
  // ✅ Global CORS headers for all API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};