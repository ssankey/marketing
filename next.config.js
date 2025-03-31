module.exports = {
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
        source: '/.well-known/pki-validation/:file',
        destination: '/api/well-known/pki-validation/:file',
      },
    ];
  },
};