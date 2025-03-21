/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "replicate.com",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compiler: {
    styledComponents: true,
  },
  pageExtensions: ['jsx', 'js', 'tsx', 'ts'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.openai.com/:path*",
      },
      {
        source: '/api/openai/:path*',
        destination: '/api/mock/openai-response',
      },
      {
        source: '/api/anthropic/:path*',
        destination: '/api/mock/anthropic-response',
      },
      {
        source: '/api/replicate/:path*',
        destination: '/api/mock/replicate-response',
      },
      {
        source: '/api/deepgram/:path*',
        destination: '/api/mock/deepgram-response',
      },
    ];
  },
};

export default nextConfig;
