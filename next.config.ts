import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

console.log('process.env.NODE_ENV => ', process.env.NODE_ENV);

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    'antd',
    '@ant-design',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-notification',
    'rc-tooltip',
    'rc-tree',
    'rc-table',
  ],
  output: 'export', // дозволяє зробити статичну збірку
  assetPrefix: isProd ? '/rad_an/' : '',
  images: { unoptimized: true }, // GitHub Pages не підтримує image optimization
};

export default nextConfig;
