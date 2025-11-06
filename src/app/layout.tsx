import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./global.css";
import { Providers } from "@/components/providers";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TownKart - Local Commerce Made Easy",
  description:
    "Complete multi-role e-commerce platform for local businesses with real-time delivery tracking",
  keywords:
    "ecommerce, local delivery, food delivery, grocery delivery, merchant platform, delivery partner",
  authors: [{ name: "TownKart Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#FF6B35",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "TownKart - Local Commerce Made Easy",
    description: "Complete multi-role e-commerce platform for local businesses",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
