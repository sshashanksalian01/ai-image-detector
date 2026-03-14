/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow images from any domain for preview
  images: {
    domains: [],
  },
  // Increase body parser size for image uploads
  api: {
    bodyParser: false,
  },
};

module.exports = nextConfig;
