'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2, Shield } from 'lucide-react'

interface PhishingResult {
  classification: string
  confidence: number
  is_phishing: boolean
  model_mode: string
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
          Paste suspicious email content below to check if it's a phishing attempt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-text">Email Content</Label>
            <textarea
              id="email-text"
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste email subject and body here..."
              className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background text-sm resize-y"
              required
              aria-label="Email content to analyze"
            />
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
