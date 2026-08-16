/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  // Disable static generation for all pages
  staticPageGenerationTimeout: 0,
  // Force all pages to be dynamic
  generateStaticParams: false,
};

export default nextConfig;