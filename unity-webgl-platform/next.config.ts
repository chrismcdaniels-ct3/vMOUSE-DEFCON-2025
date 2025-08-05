import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  
  async headers() {
    return [
      {
        source: '/api/unity-gz/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        source: '/:path*.wasm',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
        ],
      },
      {
        source: '/:path*.wasm.gz',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
          {
            key: 'Content-Encoding',
            value: 'gzip',
          },
        ],
      },
      {
        source: '/:path*.js.gz',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Content-Encoding',
            value: 'gzip',
          },
        ],
      },
      {
        source: '/:path*.data.gz',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/octet-stream',
          },
          {
            key: 'Content-Encoding',
            value: 'gzip',
          },
        ],
      },
    ];
  },
  
  output: 'standalone',
};

export default nextConfig;
