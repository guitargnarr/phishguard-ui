import { NextResponse } from 'next/server'

// Transformer model endpoint (when deployed)
const TRANSFORMER_API_URL = process.env.TRANSFORMER_API_URL || 'http://localhost:8001'

interface AttentionToken {
  token: string
  attention: number
  position: number
}

interface TransformerResponse {
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
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email_text } = body

    if (!email_text || typeof email_text !== 'string') {
      return NextResponse.json(
        { error: 'email_text is required' },
        { status: 400 }
      )
    }

    // Try to call the transformer API
    try {
      const response = await fetch(`${TRANSFORMER_API_URL}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_text }),
      })

      if (response.ok) {
        const data: TransformerResponse = await response.json()
        return NextResponse.json(data)
      }
    } catch {
      // Transformer API not available, fall back to mock
      console.log('Transformer API not available, using mock response')
    }

    // Mock response when transformer API is not running
    // This allows the UI to work during development
    const mockAttention = generateMockAttention(email_text)

    return NextResponse.json({
      prediction: mockAttention.is_phishing ? 1 : 0,
      is_phishing: mockAttention.is_phishing,
      confidence: mockAttention.confidence,
      probabilities: {
        legitimate: mockAttention.is_phishing ? 0.15 : 0.85,
        phishing: mockAttention.is_phishing ? 0.85 : 0.15
      },
      attention_analysis: mockAttention.attention_analysis,
      model_type: 'mock' // Indicates this is not from real transformer
    })

  } catch (error) {
    console.error('Explain API error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze email' },
      { status: 500 }
    )
  }
}

// Generate mock attention for development/demo purposes
function generateMockAttention(text: string): {
  is_phishing: boolean
  confidence: number
  attention_analysis: {
    top_tokens: AttentionToken[]
    high_attention_tokens: AttentionToken[]
    attention_summary: string
  }
} {
  const lowerText = text.toLowerCase()

  // Phishing indicators with weights
  const phishingIndicators: { [key: string]: number } = {
    'urgent': 0.15,
    'suspended': 0.12,
    'verify': 0.10,
    'click here': 0.11,
    'immediately': 0.09,
    'account': 0.06,
    'password': 0.08,
    'security': 0.05,
    'confirm': 0.07,
    'expire': 0.08,
    'limited time': 0.09,
    'act now': 0.10,
    'winner': 0.08,
    'prize': 0.09,
    'congratulations': 0.07
  }

  // Find which indicators are present
  const foundIndicators: AttentionToken[] = []
  let position = 0

  for (const [keyword, weight] of Object.entries(phishingIndicators)) {
    if (lowerText.includes(keyword)) {
      foundIndicators.push({
        token: keyword,
        attention: weight + (Math.random() * 0.02), // Add small variance
        position: position++
      })
    }
  }

  // Sort by attention weight
  foundIndicators.sort((a, b) => b.attention - a.attention)

  // Calculate if phishing based on found indicators
  const totalWeight = foundIndicators.reduce((sum, t) => sum + t.attention, 0)
  const isPhishing = totalWeight > 0.15 || foundIndicators.length >= 2

  // Generate confidence
  const confidence = isPhishing
    ? Math.min(0.95, 0.60 + totalWeight)
    : Math.max(0.55, 0.85 - totalWeight)

  // Generate summary
  let summary = ''
  if (foundIndicators.length > 0) {
    const topKeywords = foundIndicators.slice(0, 3).map(t => t.token)
    summary = `High attention on ${isPhishing ? 'phishing' : 'suspicious'} indicators: ${topKeywords.join(', ')}`
  } else {
    summary = 'No significant threat indicators detected'
  }

  // Add some generic tokens if not enough found
  const genericTokens = ['the', 'your', 'is', 'to', 'and']
  while (foundIndicators.length < 5) {
    const randomToken = genericTokens[foundIndicators.length % genericTokens.length]
    foundIndicators.push({
      token: randomToken,
      attention: 0.02 + (Math.random() * 0.01),
      position: position++
    })
  }

  return {
    is_phishing: isPhishing,
    confidence,
    attention_analysis: {
      top_tokens: foundIndicators.slice(0, 10),
      high_attention_tokens: foundIndicators.filter(t => t.attention > 0.05).slice(0, 5),
      attention_summary: summary
    }
  }
}
