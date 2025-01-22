import "~/styles/globals.css";

import { Inter } from "next/font/google";
import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "PixelFlow",
  description: "Make Memories with PixelFlow",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.className}`}>
      <SessionProvider>
        <SpeedInsights />
        <body>{children}</body>
      </SessionProvider>
    </html>
  );
}
