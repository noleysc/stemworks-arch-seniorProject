/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import localFont from "next/font/local";

import { AppChrome } from "@/components/app-chrome";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "Stemworks",
  description: "Multi-tenant operating dashboard for Diaz Ventures and Luminary Hotel & Co.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${newsreader.variable} bg-stone-50 font-sans text-stone-950 antialiased`}>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
