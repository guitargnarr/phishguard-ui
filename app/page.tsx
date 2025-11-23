'use client'

import { PhishGuardForm } from './components/PhishGuardForm'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            PhishGuard
          </h1>
          <p className="text-xl text-muted-foreground">
            AI-powered email security. Detect phishing attempts in seconds.
          </p>
        </div>

        <PhishGuardForm />

        <div className="text-sm text-muted-foreground space-y-2">
          <p>Powered by ML ensemble • 87% accuracy • Privacy-focused</p>
          <p className="text-xs">API: phishguard-api-production-88df.up.railway.app</p>
        </div>
      </div>
    </div>
  )
}
