import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google-cloud/speech'],
  experimental: {
    cpus: 1,
  },
  async redirects() {
    return [
      {
        source: '/trade',
        destination: '/token',
        permanent: false,
      },
      {
        source: '/lobstr',
        destination: 'https://lobstr.co/assets/LABASCOIN:GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND',
        permanent: false,
      },
      {
        source: '/swap',
        destination: 'https://lobstr.co/trade/LABASCOIN:GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/.well-known/stellar.toml',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
        ],
      },
      {
        source: '/stellar.toml',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
