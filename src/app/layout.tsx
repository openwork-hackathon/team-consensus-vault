import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://team-consensus-vault.vercel.app'),
  title: {
    default: "Consensus Vault - AI-Powered Trading",
    template: "%s | Consensus Vault"
  },
  description: "Multi-model consensus trading vault powered by AI analysts. Trade cryptocurrencies with AI-driven insights from 5 specialized models.",
  keywords: ["AI trading", "cryptocurrency", "blockchain", "DeFi", "consensus trading", "automated trading"],
  authors: [{ name: "Consensus Vault Team" }],
  creator: "Consensus Vault",
  publisher: "Consensus Vault",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://team-consensus-vault.vercel.app",
    title: "Consensus Vault - AI-Powered Trading",
    description: "Multi-model consensus trading vault powered by AI analysts",
    siteName: "Consensus Vault",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Consensus Vault - AI Trading Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Consensus Vault - AI-Powered Trading",
    description: "Multi-model consensus trading vault powered by AI analysts",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://api.coinbase.com" />
        <link rel="dns-prefetch" href="https://api.coingecko.com" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
