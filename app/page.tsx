"use client";

import { ContactForm } from "./components/ContactForm";
import {
  BarChart3,
  TrendingUp,
  Map as MapIcon,
  Landmark,
  Globe,
  Users,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#14b8a6]" />
            <span className="text-sm font-semibold text-[#f5f0eb] tracking-tight">
              Meridian
            </span>
          </a>
          <div className="flex items-center gap-6">
            <a
              href="/explore"
              className="text-xs uppercase tracking-[0.08em] text-[#8a8580] hover:text-[#f5f0eb] transition-colors"
            >
              Explore
            </a>
            <a
              href="#contact"
              className="text-xs uppercase tracking-[0.08em] text-[#8a8580] hover:text-[#f5f0eb] transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main role="main" className="relative pt-24">
        <section className="hero-gradient min-h-[80vh] flex flex-col items-center justify-center px-4">
          <div className="max-w-3xl w-full space-y-8 text-center">
            <div className="animate-stagger-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#4a4540] mb-6">
                Market Intelligence Platform
              </p>
              <h1 className="font-display text-5xl md:text-7xl tracking-[-0.03em] text-[#f5f0eb]">
                Map the{" "}
                <em className="font-display italic text-[#14b8a6]">
                  opportunity
                </em>
              </h1>
              <p className="mt-4 text-lg text-[#8a8580] max-w-xl mx-auto leading-relaxed">
                Interactive market intelligence across all 50 US states.
                Economic, demographic, and legislative data overlays
                that reveal where opportunity lives.
              </p>
            </div>

            {/* CTA */}
            <div className="animate-stagger-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/explore"
                className="btn-elite flex items-center gap-2 px-6 py-3 bg-[#14b8a6] text-white rounded-lg text-sm font-medium"
              >
                <MapIcon className="w-4 h-4" />
                Explore Markets
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#contact"
                className="flex items-center gap-2 px-6 py-3 border border-[#2a2a2a] text-[#8a8580] rounded-lg text-sm hover:border-[#14b8a6]/30 hover:text-[#f5f0eb] transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                Request Custom Data
              </a>
            </div>

            {/* Stats banner */}
            <div className="animate-stagger-3 grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 px-6 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]/50 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#3498db]" />
                <div>
                  <div className="text-sm font-medium text-[#f5f0eb]">50 States</div>
                  <div className="text-[10px] text-[#4a4540]">+ DC coverage</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-[#f97316]" />
                <div>
                  <div className="text-sm font-medium text-[#f5f0eb]">5 Overlays</div>
                  <div className="text-[10px] text-[#4a4540]">Data layers</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#14b8a6]" />
                <div>
                  <div className="text-sm font-medium text-[#f5f0eb]">330M+</div>
                  <div className="text-[10px] text-[#4a4540]">Population data</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Landmark className="w-4 h-4 text-[#ef4444]" />
                <div>
                  <div className="text-sm font-medium text-[#f5f0eb]">Real-Time</div>
                  <div className="text-[10px] text-[#4a4540]">Legislative tracking</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Accent separator */}
        <div className="accent-line max-w-4xl mx-auto" />

        {/* Capabilities Section */}
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#4a4540] mb-4">
                Capabilities
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-[#f5f0eb] tracking-[-0.02em]">
                From raw{" "}
                <em className="font-display italic text-[#14b8a6]">
                  data
                </em>{" "}
                to market clarity
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="card-glass rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#3498db]/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#3498db]" />
                </div>
                <h3 className="text-sm font-medium text-[#f5f0eb]">
                  Economic Overlays
                </h3>
                <p className="text-xs text-[#8a8580] leading-relaxed">
                  Population density, median income, poverty rates, and
                  employment statistics. See economic health at a glance
                  with color-coded choropleth maps.
                </p>
              </div>

              <div className="card-glass rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#ef4444]/10 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-[#ef4444]" />
                </div>
                <h3 className="text-sm font-medium text-[#f5f0eb]">
                  Legislative Intelligence
                </h3>
                <p className="text-xs text-[#8a8580] leading-relaxed">
                  Track state-level regulations, data privacy laws, and
                  consumer protection legislation. Understand the
                  regulatory landscape before you enter a market.
                </p>
              </div>

              <div className="card-glass rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#14b8a6]/10 flex items-center justify-center">
                  <MapIcon className="w-5 h-5 text-[#14b8a6]" />
                </div>
                <h3 className="text-sm font-medium text-[#f5f0eb]">
                  Geographic Analysis
                </h3>
                <p className="text-xs text-[#8a8580] leading-relaxed">
                  Zoomable map with county-level detail, interstate highway
                  overlays, and state-by-state comparison. Click any state
                  to drill down into local metrics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Accent separator */}
        <div className="accent-line max-w-4xl mx-auto" />

        {/* Contact Form */}
        <section
          aria-labelledby="contact-heading"
          className="py-24 px-4"
          id="contact"
        >
          <div className="max-w-xl mx-auto text-center space-y-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#4a4540] mb-4">
                Get Started
              </p>
              <h2
                id="contact-heading"
                className="font-display text-3xl text-[#f5f0eb] tracking-[-0.02em]"
              >
                Request a{" "}
                <em className="font-display italic text-[#14b8a6]">demo</em>
              </h2>
              <p className="mt-3 text-sm text-[#8a8580]">
                See how Meridian can help you identify and evaluate
                market opportunities across the United States.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-8 px-4">
        <div className="max-w-4xl mx-auto text-center text-sm text-[#4a4540] space-y-4">
          <p>Built by Matthew Scott | Louisville, KY</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
            <a
              href="mailto:matthewdscott7@gmail.com"
              className="hover:text-[#8a8580] transition min-h-[44px] flex items-center px-2"
            >
              matthewdscott7@gmail.com
            </a>
            <span className="hidden sm:inline text-[#1a1a1a]">|</span>
            <a
              href="/privacy"
              className="hover:text-[#8a8580] transition min-h-[44px] flex items-center px-2"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
