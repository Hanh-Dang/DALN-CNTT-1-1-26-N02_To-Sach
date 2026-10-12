import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
      },
      {
        protocol: 'https',
        hostname: 'salt.tikicdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.openlibrary.org',
      },
      {
        protocol: 'https',
        hostname: '**.tikicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn0.fahasa.com',
      },
      {
        protocol: 'https',
        hostname: '**.fahasa.com',
      },
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
      {
        protocol: 'https',
        hostname: 'img.vietqr.io',
      },
      {
        protocol: 'https',
        hostname: 'api.vietqr.io',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/books/:slug',
        destination: '/book/:slug',
        permanent: true,
      },
      {
        source: '/books',
        destination: '/catalog',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
