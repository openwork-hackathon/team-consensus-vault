import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navigation from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true, // Enable preload for faster font loading
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://team-consensus-vault.vercel.app'),
  title: {
    default: "Consensus Vault - Multi-Agent Decision Making",
    template: "%s | Consensus Vault"
  },
  description: "AI-powered consensus building platform for decentralized decision making. Multi-agent voting and consensus platform for the Openwork hackathon.",
  keywords: ["AI consensus", "multi-agent", "voting", "decentralized decision making", "Openwork hackathon", "blockchain", "DeFi"],
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
    title: "Consensus Vault - Multi-Agent Decision Making",
    description: "AI-powered consensus building platform for decentralized decision making",
    siteName: "Consensus Vault",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Consensus Vault - Multi-Agent Decision Making Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Consensus Vault - Multi-Agent Decision Making",
    description: "AI-powered consensus building platform for decentralized decision making",
    images: ["/og-image.svg"],
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
        {/* Critical preconnect for fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
          key="fonts-googleapis"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
          key="fonts-gstatic"
        />
        {/* Preconnect for API endpoints */}
        <link rel="preconnect" href="https://api.coinbase.com" key="coinbase" />
        <link rel="preconnect" href="https://api.coingecko.com" key="coingecko" />
        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" key="dns-fonts" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" key="dns-gstatic" />
        <link rel="dns-prefetch" href="https://api.coinbase.com" key="dns-coinbase" />
        <link rel="dns-prefetch" href="https://api.coingecko.com" key="dns-coingecko" />
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/_next/static/css/app/layout.css"
          as="style"
          key="critical-css"
        />
        {/* Defer non-critical scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Defer service worker registration using requestIdleCallback
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  var registerSW = function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      }, function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  };
                  if ('requestIdleCallback' in window) {
                    requestIdleCallback(registerSW);
                  } else {
                    setTimeout(registerSW, 1000);
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-semibold"
          >
            Skip to main content
          </a>
          <Navigation 
            title="Consensus Vault"
            subtitle="AI Multi-Model Trading Intelligence"
            showMarketInfo={true}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
