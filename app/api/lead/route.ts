import { NextResponse } from 'next/server'

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

// Simple in-memory rate limit
const recentRequests = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const requests = recentRequests.get(ip) ?? []
  const recent = requests.filter(t => now - t < 60000)
  if (recent.length >= 5) return true
  recent.push(now)
  recentRequests.set(ip, recent)
  return false
}

export async function POST(request: Request) {
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (isRateLimited(clientIP)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const { name, email, company, message } = await request.json()

    if (!name || !email || !company) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (SLACK_WEBHOOK_URL) {
      const slackMessage = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'New Meridian Demo Request',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Name:*\n${name}` },
              { type: 'mrkdwn', text: `*Email:*\n${email}` },
              { type: 'mrkdwn', text: `*Company:*\n${company}` }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message:*\n${message || 'No message provided'}`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Submitted at ${new Date().toISOString()}`
              }
            ]
          }
        ]
      }

      await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit lead' },
      { status: 500 }
    )
  }
}
