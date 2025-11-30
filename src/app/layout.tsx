import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./global.css";
import { Providers } from "@/components/providers";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import React from "react";

export const metadata: Metadata = {
  title: "TownKart - Local Marketplace",
  description:
    "Your local marketplace for fresh groceries, daily essentials, and more. Fast delivery within 30-60 minutes.",
  keywords: [
    "local marketplace",
    "grocery delivery",
    "fresh produce",
    "daily essentials",
    "fast delivery",
  ],
  authors: [{ name: "TownKart Team" }],
  creator: "TownKart",
  publisher: "TownKart",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://townkart.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TownKart - Local Marketplace",
    description:
      "Your local marketplace for fresh groceries, daily essentials, and more. Fast delivery within 30-60 minutes.",
    url: "https://townkart.com",
    siteName: "TownKart",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TownKart - Local Marketplace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TownKart - Local Marketplace",
    description:
      "Your local marketplace for fresh groceries, daily essentials, and more. Fast delivery within 30-60 minutes.",
    images: ["/og-image.jpg"],
    creator: "@townkart",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TownKart" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body>
        <Providers>
          <RoleBasedLayout>{children}</RoleBasedLayout>
          <ToastProvider>
            <ToastViewport />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
