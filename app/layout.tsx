import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // <-- TAMBAHKAN IMPORT INI
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import RankUpPopup from '@/components/Leaderboard/RankUpPopup';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lingora",
  description: "Learn with Lingora",
  manifest: "/manifest.json",
  other: {
    "google-adsense-account": "ca-pub-6934703851524831"
  }
};

export const viewport: Viewport = {
  themeColor: "#08080f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* <-- KODE VERIFIKASI ADSENSE --> */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6934703851524831"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <RankUpPopup />
        </AuthProvider>
      </body>
    </html>
  );
}