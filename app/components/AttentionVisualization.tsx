'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Loader2, Eye, AlertTriangle, CheckCircle, X } from 'lucide-react'

interface AttentionToken {
  token: string
  attention: number
  position: number
}

interface AttentionResult {
  prediction: number
  is_phishing: boolean
  confidence: number
  probabilities: {
    legitimate: number
    phishing: number
  }
  attention_analysis: {
    top_tokens: AttentionToken[]
    high_attention_tokens: AttentionToken[]
    attention_summary: string
  }
  model_type?: string
}

interface AttentionVisualizationProps {
  emailText: string
  onClose?: () => void
}

export function AttentionVisualization({ emailText, onClose }: AttentionVisualizationProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AttentionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeWithTransformer = async () => {
    if (!emailText.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_text: emailText })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze with transformer')
      }

      const data: AttentionResult = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  // Highlight text based on attention weights
  const highlightText = (text: string, tokens: AttentionToken[]) => {
    if (!tokens.length) return text

    // Create a map of tokens to attention weights
    const tokenMap = new Map(tokens.map(t => [t.token.toLowerCase(), t.attention]))
    const maxAttention = Math.max(...tokens.map(t => t.attention))

    // Split text into words and highlight
    const words = text.split(/(\s+)/)

    return words.map((word, idx) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?";:]/g, '')
      const attention = tokenMap.get(cleanWord) || 0

      if (attention > 0) {
        // Normalize to 0-1
        const normalized = attention / maxAttention
        // Color from teal (low) to orange (high attention) - brand colors
        // Teal: #14b8a6 (20, 184, 166) | Orange: #f97316 (249, 115, 22)
        const r = Math.round(20 + (229 * normalized))  // 20 -> 249
        const g = Math.round(184 - (69 * normalized))  // 184 -> 115
        const b = Math.round(166 - (144 * normalized)) // 166 -> 22
        const opacity = 0.4 + (normalized * 0.4)

        return (
          <span
            key={idx}
            style={{
              backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
              padding: '1px 3px',
              borderRadius: '3px',
              transition: 'background-color 0.3s'
            }}
            title={`Attention: ${(attention * 100).toFixed(1)}%`}
          >
            {word}
          </span>
        )
      }
      return word
    })
  }

  if (!result) {
    return (
      <div className="mt-4">
        <Button
          onClick={analyzeWithTransformer}
          disabled={loading || !emailText.trim()}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing with Transformer...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Explain Decision (Transformer AI)
            </>
          )}
        </Button>
        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}
      </div>
    )
  }

  return (
    <Card className="mt-4 border-2 border-teal-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-teal-500" />
            Transformer Analysis
            {result.model_type === 'mock' && (
              <Badge variant="outline" className="text-xs">Demo Mode</Badge>
            )}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prediction Summary */}
        <div className={`p-3 rounded-lg ${
          result.is_phishing
            ? 'bg-red-500/10 border border-red-500/30'
            : 'bg-green-500/10 border border-green-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.is_phishing ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <span className="font-semibold">
                {result.is_phishing ? 'Phishing Detected' : 'Appears Legitimate'}
              </span>
            </div>
            <Badge variant={result.is_phishing ? 'destructive' : 'default'}>
              {(result.confidence * 100).toFixed(1)}% confident
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {result.attention_analysis.attention_summary}
          </p>
        </div>

        {/* Attention Visualization */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Eye className="h-4 w-4" />
            What the model focused on:
          </div>
          <div className="p-3 bg-muted rounded-lg text-sm leading-relaxed font-mono">
            {highlightText(emailText.slice(0, 500), result.attention_analysis.top_tokens)}
            {emailText.length > 500 && '...'}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(20, 184, 166, 0.5)' }}></span>
              Low attention
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(134, 150, 94, 0.6)' }}></span>
              Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(249, 115, 22, 0.8)' }}></span>
              High attention
            </span>
          </div>
        </div>

        {/* Top Tokens */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Highest Attention Tokens:</div>
          <div className="flex flex-wrap gap-2">
            {result.attention_analysis.high_attention_tokens.map((token, idx) => {
              const normalized = Math.min(1, token.attention / 0.15)
              const r = Math.round(20 + (229 * normalized))
              const g = Math.round(184 - (69 * normalized))
              const b = Math.round(166 - (144 * normalized))
              return (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="font-mono"
                  style={{
                    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.2)`,
                    borderColor: `rgba(${r}, ${g}, ${b}, 0.5)`
                  }}
                >
                  {token.token}: {(token.attention * 100).toFixed(1)}%
                </Badge>
              )
            })}
          </div>
        </div>

        {/* Probabilities */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {(result.probabilities.legitimate * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Legitimate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {(result.probabilities.phishing * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Phishing</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          Powered by DistilBERT transformer with attention visualization
        </p>
      </CardContent>
    </Card>
  )
}
