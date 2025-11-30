'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2, Shield, Sparkles } from 'lucide-react'

interface PhishingResult {
  classification: string
  confidence: number
  is_phishing: boolean
  model_mode: string
}

// Real-time threat detection keywords
const THREAT_KEYWORDS = {
  high: ['urgent', 'suspended', 'verify your', 'click here', 'immediately', 'act now', 'limited time', 'account closed'],
  medium: ['password', 'confirm', 'update your', 'security alert', 'unusual activity', 'verify identity', 'prize', 'winner'],
  low: ['invoice', 'payment', 'wire transfer', 'bitcoin', 'gift card']
}

function getThreatLevel(text: string): { level: 'none' | 'low' | 'medium' | 'high'; matches: string[] } {
  const lowerText = text.toLowerCase()
  const matches: string[] = []

  for (const keyword of THREAT_KEYWORDS.high) {
    if (lowerText.includes(keyword)) matches.push(keyword)
  }
  if (matches.length >= 2) return { level: 'high', matches }

  for (const keyword of THREAT_KEYWORDS.medium) {
    if (lowerText.includes(keyword)) matches.push(keyword)
  }
  if (matches.length >= 2) return { level: 'high', matches }
  if (matches.length === 1) return { level: 'medium', matches }

  for (const keyword of THREAT_KEYWORDS.low) {
    if (lowerText.includes(keyword)) matches.push(keyword)
  }
  if (matches.length > 0) return { level: 'low', matches }

  return { level: 'none', matches: [] }
}

const EXAMPLE_EMAILS = {
  phishing: `Subject: URGENT: Your Account Has Been Suspended!

Dear Valued Customer,

We have detected unusual activity on your account. Your account has been temporarily suspended due to security concerns.

To restore access immediately, click the link below and verify your identity:
http://secure-bank-verify.suspicious-domain.com/restore

If you do not verify within 24 hours, your account will be permanently closed.

Regards,
Security Team`,
  legitimate: `Subject: Your Order #12345 Has Shipped

Hi there,

Great news! Your order has been shipped and is on its way.

Order Details:
- Order Number: 12345
- Estimated Delivery: December 2-4, 2025
- Carrier: UPS

You can track your package using the tracking number in your account.

Thank you for shopping with us!

Best regards,
Customer Service Team`
}

export function PhishGuardForm() {
  const [emailText, setEmailText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PhishingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('https://phishguard-api-production-88df.up.railway.app/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_text: emailText,
          mode: 'simple'
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data: PhishingResult = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Email Security Check
        </CardTitle>
        <CardDescription>
          Paste suspicious email content below to check if it&apos;s a phishing attempt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-text">Email Content</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmailText(EXAMPLE_EMAILS.phishing)
                    setResult(null)
                    setError(null)
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Try Phishing Example
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmailText(EXAMPLE_EMAILS.legitimate)
                    setResult(null)
                    setError(null)
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Try Safe Example
                </Button>
              </div>
            </div>
            <textarea
              id="email-text"
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste email subject and body here..."
              className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background text-sm resize-y"
              required
              aria-label="Email content to analyze"
            />
            {/* Real-time threat indicator */}
            {emailText.trim() && (() => {
              const threat = getThreatLevel(emailText)
              if (threat.level === 'none') return null
              return (
                <div className={`flex items-center gap-2 mt-2 p-2 rounded text-sm ${
                  threat.level === 'high' ? 'bg-red-500/10 text-red-600' :
                  threat.level === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                  'bg-blue-500/10 text-blue-600'
                }`}>
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {threat.level === 'high' ? 'High risk' :
                     threat.level === 'medium' ? 'Suspicious' : 'Caution'}
                    {' '}&bull; Found: {threat.matches.slice(0, 3).join(', ')}
                  </span>
                </div>
              )
            })()}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !emailText.trim()}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Check for Phishing
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm" role="alert">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3 p-4 rounded-md bg-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.is_phishing ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                <span className="font-semibold">
                  {result.is_phishing ? 'Phishing Detected' : 'Appears Safe'}
                </span>
              </div>
              <Badge variant={result.is_phishing ? 'destructive' : 'default'}>
                {(result.confidence * 100).toFixed(1)}% confidence
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              Classification: {result.classification} • Model: {result.model_mode}
            </p>

            {result.is_phishing && (
              <div className="text-sm p-3 bg-destructive/10 rounded border-l-4 border-destructive">
                <p className="font-semibold text-destructive">⚠️ Warning</p>
                <p className="text-destructive/80 mt-1">
                  This email shows signs of a phishing attempt. Do not click links or provide personal information.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
