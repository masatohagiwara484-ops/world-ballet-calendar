/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  logging: {
    fetches: { fullUrl: false },
  },
};

export default nextConfig;
