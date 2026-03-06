import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Christians Debate",
    template: "%s | Christians Debate",
  },
  description:
    "Structured debate platform for meaningful theological discussions. Explore multiple perspectives, track stance shifts, and find the strongest arguments.",
  metadataBase: new URL(process.env.AUTH_URL || "http://localhost:3000"),
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Christians Debate",
    title: "Christians Debate",
    description:
      "Structured debate platform for meaningful theological discussions. Explore multiple perspectives, track stance shifts, and find the strongest arguments.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Christians Debate — Structured discussions that illuminate truth",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Christians Debate",
    description:
      "Structured debate platform for meaningful theological discussions.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="nordic-clean" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Header />
          <main className="min-h-[calc(100dvh-3.5rem)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
