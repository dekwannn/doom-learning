import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Matikan PWA saat mode coding
  register: true,
  // The quiz videos are not saved for offline use up front (they load when a video question is opened)
  publicExcludes: ["!noprecache/**/*", "!video/**/*"],
  // skipWaiting: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // ── TAMBAHKAN 2 PENGATURAN INI UNTUK CAPACITOR ──
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);