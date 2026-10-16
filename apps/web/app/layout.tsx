/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import localFont from "next/font/local";

import { DeskNav } from "@/components/desk-nav";

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
  title: "Luminary Desk",
  description: "Room and restaurant bookings for Luminary Hotel & Co., collected from the Luminary website, Airbnb, and the outlets.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${newsreader.variable} bg-stone-50 font-sans text-stone-950 antialiased`}>
        <DeskNav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
