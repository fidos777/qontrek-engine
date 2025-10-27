/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/', destination: '/demo/g2', permanent: false },
      { source: '/g2', destination: '/demo/g2', permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: '/demo/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
