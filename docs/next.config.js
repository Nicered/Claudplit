/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/ClaudeShip' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ClaudeShip/' : '',
};

module.exports = nextConfig;
