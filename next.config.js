// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
// };

// module.exports = nextConfig;


module.exports = {
  webpack: (config) => {
    config.resolve.fallback = {
      tls: false,
      net: false,
      fs: false,
      crypto: false,
      ...config.resolve.fallback,
    };
    return config;
  },
};
