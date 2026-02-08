import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#050505",
};

export const metadata: Metadata = {
  title: "PhishGuard - Threat Intelligence & Infrastructure Mapping",
  description:
    "Map scam infrastructure graphs. Reveal connections between domains, IPs, registrants, and SSL certificates that expose coordinated phishing operations.",
  metadataBase: new URL("https://phishguard.projectlavos.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "PhishGuard - Threat Intelligence & Infrastructure Mapping",
    description:
      "Map scam infrastructure graphs. Reveal connections between domains, IPs, registrants, and SSL certificates that expose coordinated phishing operations.",
    url: "https://phishguard.projectlavos.com",
    siteName: "PhishGuard",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PhishGuard - Threat Intelligence Graph",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PhishGuard - Threat Intelligence & Infrastructure Mapping",
    description:
      "Map scam infrastructure graphs. Reveal connections between phishing domains, IPs, and certificates.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PhishGuard",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Threat intelligence platform that maps scam infrastructure graphs, revealing phishing campaign connections through DNS, WHOIS, and SSL analysis.",
  url: "https://phishguard.projectlavos.com",
  image: "https://phishguard.projectlavos.com/og-image.png",
  author: {
    "@type": "Person",
    name: "Matthew Scott",
    url: "https://projectlavos.com",
  },
  featureList: [
    "Infrastructure graph mapping",
    "DNS, WHOIS, SSL enrichment",
    "Campaign clustering",
    "Pivot point detection",
    "ML-powered email classification",
    "Risk scoring (0-100)",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-[#050505] text-[#f5f0eb]">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <div className="noise-overlay" aria-hidden="true" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
