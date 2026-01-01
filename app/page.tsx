'use client'

import { PhishGuardForm } from './components/PhishGuardForm'
import { ContactForm } from './components/ContactForm'
import { ApiStatus } from './components/ApiStatus'
import { Shield, Zap, Brain, Target } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Hero Section */}
      <main role="main" className="flex flex-col items-center justify-center min-h-[70vh] p-4 hero-gradient">
        <div className="max-w-3xl w-full space-y-8 text-center">
          <div className="space-y-4 animate-fade-in-up">
            <div className="inline-block px-4 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-sm font-medium mb-4">
              Enterprise Email Security
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-shimmer">
              PhishGuard
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto">
              ML-powered phishing detection. Protect your organization from email threats with 87% accuracy.
            </p>
          </div>

          {/* Trust Banner - grid on mobile for better spacing */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-4 md:gap-6 py-6 px-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 text-sm min-h-[44px]">
              <Shield className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <div>
                <div className="font-semibold text-white">Local-First</div>
                <div className="text-slate-400 text-xs">Architecture</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm min-h-[44px]">
              <Zap className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div>
                <div className="font-semibold text-white">&lt;15ms</div>
                <div className="text-slate-400 text-xs">Response</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm min-h-[44px]">
              <Brain className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <div>
                <div className="font-semibold text-white">2,039</div>
                <div className="text-slate-400 text-xs">Features</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm min-h-[44px]">
              <Target className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div>
                <div className="font-semibold text-white">87%</div>
                <div className="text-slate-400 text-xs">Accuracy</div>
              </div>
            </div>
          </div>

          <PhishGuardForm />

          {/* API Status */}
          <div className="flex justify-center">
            <ApiStatus />
          </div>
        </div>
      </main>

      {/* Value Proposition */}
      <section aria-labelledby="value-proposition-heading" className="bg-slate-800/50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 id="value-proposition-heading" className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-teal-400 to-orange-400 bg-clip-text text-transparent">
            Why Enterprise Teams Choose PhishGuard
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-elite text-center space-y-3 p-6 rounded-xl">
              <div className="text-4xl text-teal-400">$4.9M</div>
              <div className="text-slate-300">Average cost of a data breach in 2024</div>
            </div>
            <div className="text-center space-y-3">
              <div className="text-4xl text-orange-400">91%</div>
              <div className="text-slate-300">Of cyberattacks start with phishing</div>
            </div>
            <div className="text-center space-y-3">
              <div className="text-4xl text-teal-400">3.4B</div>
              <div className="text-slate-300">Phishing emails sent daily</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section aria-labelledby="contact-heading" className="py-16 px-4" id="contact">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <h2 id="contact-heading" className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-orange-400 bg-clip-text text-transparent">
            Request Enterprise Demo
          </h2>
          <p className="text-slate-300">
            See how PhishGuard can protect your organization. Get a personalized demo and security assessment.
          </p>
          <ContactForm />
        </div>
      </section>

      {/* Footer - mobile optimized with proper touch targets */}
      <footer className="border-t border-slate-700 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center text-sm text-slate-400 space-y-4">
          <p>Built by Matthew Scott | ML Engineer | Louisville, KY</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
            <a
              href="mailto:matthewdscott7@gmail.com"
              className="hover:text-white transition min-h-[44px] flex items-center px-2"
            >
              matthewdscott7@gmail.com
            </a>
            <span className="hidden sm:inline text-slate-600">|</span>
            <a
              href="/privacy"
              className="hover:text-white transition min-h-[44px] flex items-center px-2"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
