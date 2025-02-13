/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: [
    '@ant-design/icons',
    '@ant-design/cssinjs',
    '@autoform/mui',
    '@autoform/zod',
    '@mui/material',
    '@mui/icons-material',
    '@emotion/react',
    '@emotion/styled'
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 