"use client";

import { PhishGuardForm } from "./components/PhishGuardForm";
import { ContactForm } from "./components/ContactForm";
import { ApiStatus } from "./components/ApiStatus";
import {
  Shield,
  Zap,
  Brain,
  Target,
  Network,
  Globe,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#14b8a6]" />
            <span className="text-sm font-semibold text-[#f5f0eb] tracking-tight">
              PhishGuard
            </span>
          </a>
          <div className="flex items-center gap-6">
            <a
              href="#analyze"
              className="text-xs uppercase tracking-[0.08em] text-[#8a8580] hover:text-[#f5f0eb] transition-colors"
            >
              Analyze
            </a>
            <a
              href="/investigate"
              className="text-xs uppercase tracking-[0.08em] text-[#8a8580] hover:text-[#f5f0eb] transition-colors"
            >
              Investigate
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
                Threat Intelligence Platform
              </p>
              <h1 className="font-display text-5xl md:text-7xl tracking-[-0.03em] text-[#f5f0eb]">
                See the{" "}
                <em className="font-display italic text-[#14b8a6]">
                  infrastructure
                </em>
              </h1>
              <p className="mt-4 text-lg text-[#8a8580] max-w-xl mx-auto leading-relaxed">
                Map the connections between phishing domains, IPs, registrants,
                and certificates. The graph reveals what text cannot.
              </p>
            </div>

            {/* CTA */}
            <div className="animate-stagger-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/investigate"
                className="btn-elite flex items-center gap-2 px-6 py-3 bg-[#14b8a6] text-white rounded-lg text-sm font-medium"
              >
                <Network className="w-4 h-4" />
                Investigate Infrastructure
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#analyze"
                className="flex items-center gap-2 px-6 py-3 border border-[#2a2a2a] text-[#8a8580] rounded-lg text-sm hover:border-[#14b8a6]/30 hover:text-[#f5f0eb] transition-all"
              >
                <Shield className="w-4 h-4" />
                Classify Email
              </a>
            </div>

            {/* Stats banner */}
            <div className="animate-stagger-3 grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 px-6 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]/50 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#3498db]" />
                <div>
                  <div className="text-sm font-medium text-[#f5f0eb]">9 Types</div>
                  <div className="text-[10px] text-[#4a4540]">Node analysis</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-[#f97316]" />
                <div>
                  <div className="text-sm font-medium text-[#f5f0eb]">30+</div>
                  <div className="text-[10px] text-[#4a4540]">API endpoints</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Brain className="w-4 h-4 text-[#14b8a6]" />
                <div>
                  <div className="text-sm font-medium text-[#f5f0eb]">2,039</div>
                  <div className="text-[10px] text-[#4a4540]">ML features</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4 text-[#e74c3c]" />
                <div>
                  <div className="text-sm font-medium text-[#f5f0eb]">0-100</div>
                  <div className="text-[10px] text-[#4a4540]">Risk scoring</div>
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
                From a single{" "}
                <em className="font-display italic text-[#14b8a6]">
                  artifact
                </em>{" "}
                to the full campaign
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="card-glass rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#3498db]/10 flex items-center justify-center">
                  <Network className="w-5 h-5 text-[#3498db]" />
                </div>
                <h3 className="text-sm font-medium text-[#f5f0eb]">
                  Infrastructure Mapping
                </h3>
                <p className="text-xs text-[#8a8580] leading-relaxed">
                  Build directed graphs connecting domains, IPs, nameservers,
                  registrants, and SSL certificates. See how 15 phishing sites
                  share one IP.
                </p>
              </div>

              <div className="card-glass rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#14b8a6]/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#14b8a6]" />
                </div>
                <h3 className="text-sm font-medium text-[#f5f0eb]">
                  Deep Enrichment
                </h3>
                <p className="text-xs text-[#8a8580] leading-relaxed">
                  DNS records, WHOIS registration, SSL certificate fingerprints,
                  carrier lookup, VoIP detection. Every artifact enriched
                  automatically.
                </p>
              </div>

              <div className="card-glass rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#e74c3c]/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#e74c3c]" />
                </div>
                <h3 className="text-sm font-medium text-[#f5f0eb]">
                  Risk Scoring
                </h3>
                <p className="text-xs text-[#8a8580] leading-relaxed">
                  Weighted risk assessment: domain age, WHOIS privacy,
                  registrar reputation, VoIP indicators, SSL anomalies. Score
                  0-100 per artifact.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Accent separator */}
        <div className="accent-line max-w-4xl mx-auto" />

        {/* Email Classification Section */}
        <section id="analyze" className="py-24 px-4">
          <div className="max-w-3xl mx-auto space-y-8 text-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#4a4540] mb-4">
                Email Analysis
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-[#f5f0eb] tracking-[-0.02em]">
                Classify suspicious{" "}
                <em className="font-display italic text-[#14b8a6]">emails</em>
              </h2>
              <p className="mt-3 text-sm text-[#8a8580]">
                ML-powered classification with 87% accuracy, analyzing 2,039
                features in under 15ms.
              </p>
            </div>

            <PhishGuardForm />

            <div className="flex justify-center">
              <ApiStatus />
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
                See how PhishGuard can map your organization&apos;s threat
                landscape.
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
