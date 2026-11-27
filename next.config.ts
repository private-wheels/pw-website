import type { NextConfig } from "next";

// Listing photos are served from Supabase Storage's public bucket.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  experimental: {
    // Next 16 takes an exclusive lock on the dist dir and refuses to start a
    // second `next dev` for the same project directory. Disabled so a preview
    // server can run alongside another chat's dev server on this checkout.
    lockDistDir: false,
  },
  images: {
    // Fewer widths than the default (which goes up to 3840) means fewer
    // variants of each photo for Vercel to resize on first view, so visitors
    // hit an already-resized copy more often. 1920 covers a full-width banner.
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl}/storage/v1/object/public/listing-photos/**`)]
      : [],
  },
};

export default nextConfig;
