import { describe, it, expect, beforeEach } from 'vitest'
import { server } from '../mocks/server'
import { errorHandlers } from '../mocks/handlers'

const API_URL = 'https://phishguard-api-production-88df.up.railway.app'

describe('PhishGuard API Integration', () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  describe('POST /classify', () => {
    it('returns phishing classification for suspicious emails', async () => {
      const response = await fetch(`${API_URL}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_text: 'URGENT: Your account has been suspended. Click here to verify.',
          mode: 'simple'
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()

      expect(data.classification).toBe('phishing')
      expect(data.is_phishing).toBe(true)
      expect(data.confidence).toBeGreaterThan(0)
      expect(data.confidence).toBeLessThanOrEqual(1)
      expect(data.model_mode).toBe('simple')
    })

    it('returns legitimate classification for safe emails', async () => {
      const response = await fetch(`${API_URL}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_text: 'Your order has been shipped. Track your package at our website.',
          mode: 'simple'
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()

      expect(data.classification).toBe('legitimate')
      expect(data.is_phishing).toBe(false)
      expect(data.confidence).toBeGreaterThan(0)
      expect(data.confidence).toBeLessThanOrEqual(1)
    })

    it('handles empty email gracefully', async () => {
      const response = await fetch(`${API_URL}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_text: '',
          mode: 'simple'
        })
      })

      expect(response.ok).toBe(true)
    })

    it('returns correct response structure', async () => {
      const response = await fetch(`${API_URL}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_text: 'Test email content',
          mode: 'simple'
        })
      })

      const data = await response.json()

      // Verify all required fields exist
      expect(data).toHaveProperty('classification')
      expect(data).toHaveProperty('confidence')
      expect(data).toHaveProperty('is_phishing')
      expect(data).toHaveProperty('model_mode')

      // Verify types
      expect(typeof data.classification).toBe('string')
      expect(typeof data.confidence).toBe('number')
      expect(typeof data.is_phishing).toBe('boolean')
      expect(typeof data.model_mode).toBe('string')
    })
  })

  describe('Error Handling', () => {
    it('handles server errors gracefully', async () => {
      server.use(errorHandlers.serverError)

      const response = await fetch(`${API_URL}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_text: 'Test email',
          mode: 'simple'
        })
      })

      expect(response.status).toBe(500)
    })

    it('handles bad requests gracefully', async () => {
      server.use(errorHandlers.badRequest)

      const response = await fetch(`${API_URL}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_text: 'Test email',
          mode: 'simple'
        })
      })

      expect(response.status).toBe(400)
    })

    it('handles network errors', async () => {
      server.use(errorHandlers.networkError)

      await expect(
        fetch(`${API_URL}/classify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email_text: 'Test email',
            mode: 'simple'
          })
        })
      ).rejects.toThrow()
    })
  })

  describe('Phishing Detection Keywords', () => {
    // These keywords match the mock handler logic in handlers.ts
    const phishingKeywords = [
      'urgent',
      'suspended',
      'click here',
      'verify your',
      'phishing',
    ]

    phishingKeywords.forEach(keyword => {
      it(`detects phishing email containing "${keyword}"`, async () => {
        const response = await fetch(`${API_URL}/classify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email_text: `Please ${keyword} to secure your account`,
            mode: 'simple'
          })
        })

        const data = await response.json()
        expect(data.is_phishing).toBe(true)
      })
    })
  })

  describe('Legitimate Email Patterns', () => {
    const legitimateEmails = [
      'Thank you for your purchase. Your receipt is attached.',
      'Meeting scheduled for tomorrow at 3pm.',
      'Your monthly newsletter is here!',
      'Happy birthday! Hope you have a great day.',
    ]

    legitimateEmails.forEach(email => {
      it(`classifies legitimate email: "${email.substring(0, 30)}..."`, async () => {
        const response = await fetch(`${API_URL}/classify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email_text: email,
            mode: 'simple'
          })
        })

        const data = await response.json()
        expect(data.is_phishing).toBe(false)
      })
    })
  })

  describe('Confidence Scores', () => {
    it('returns high confidence for obvious phishing', async () => {
      const response = await fetch(`${API_URL}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_text: 'URGENT! Click here immediately to verify your suspended account!',
          mode: 'simple'
        })
      })

      const data = await response.json()
      expect(data.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('returns confidence between 0 and 1', async () => {
      const response = await fetch(`${API_URL}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_text: 'Any email content here',
          mode: 'simple'
        })
      })

      const data = await response.json()
      expect(data.confidence).toBeGreaterThanOrEqual(0)
      expect(data.confidence).toBeLessThanOrEqual(1)
    })
  })
})
