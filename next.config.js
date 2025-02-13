/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@ant-design/icons',
    '@ant-design/cssinjs',
    '@autoform/mui',
    '@autoform/zod',
    '@mui/material',
    '@mui/icons-material',
    '@emotion/react',
    '@emotion/styled'
  ]
}

module.exports = nextConfig 