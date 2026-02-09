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
  title: "Meridian | US Economic Data Explorer",
  description:
    "Explore state-level economic data across the US. Live unemployment, income, population, and poverty metrics visualized on an interactive map.",
  metadataBase: new URL("https://meridian.projectlavos.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Meridian | US Economic Data Explorer",
    description:
      "Explore state-level economic data across the US. Live unemployment, income, population, and poverty metrics visualized on an interactive map.",
    url: "https://meridian.projectlavos.com",
    siteName: "Meridian",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Meridian - US Economic Data Explorer",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meridian | US Economic Data Explorer",
    description:
      "Explore state-level economic data across the US. Live unemployment, income, population, and poverty metrics visualized on an interactive map.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Meridian",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "US economic data explorer with live BLS and Census data. Interactive map with unemployment, income, population, and poverty metrics across all 50 states.",
  url: "https://meridian.projectlavos.com",
  image: "https://meridian.projectlavos.com/og-image.png",
  author: {
    "@type": "Person",
    name: "Matthew Scott",
    url: "https://projectlavos.com",
  },
  featureList: [
    "Population density choropleth",
    "Income and poverty overlays",
    "Employment and gig economy metrics",
    "Legislative tracking by state",
    "Interstate highway overlay",
    "County-level zoom detail",
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
