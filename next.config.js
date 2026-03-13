/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/smtr/:path*',
        destination: 'https://dados.mobilidade.rio/:path*',
      },
    ]
  },
}

module.exports = nextConfig