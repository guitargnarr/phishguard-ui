import { http, HttpResponse, delay } from 'msw'

const API_URL = 'https://phishguard-api-production-88df.up.railway.app'

// Mock responses for different email types
export const mockPhishingResponse = {
  classification: 'phishing',
  confidence: 0.84,
  is_phishing: true,
  model_mode: 'simple'
}

export const mockLegitimateResponse = {
  classification: 'legitimate',
  confidence: 0.92,
  is_phishing: false,
  model_mode: 'simple'
}

export const handlers = [
  // Classify endpoint - normal responses
  http.post(`${API_URL}/classify`, async ({ request }) => {
    const body = await request.json() as { email_text: string; mode: string }

    // Simulate realistic delay
    await delay(100)

    // Determine response based on email content
    const emailText = body.email_text.toLowerCase()

    if (
      emailText.includes('urgent') ||
      emailText.includes('suspended') ||
      emailText.includes('click here') ||
      emailText.includes('verify your') ||
      emailText.includes('phishing')
    ) {
      return HttpResponse.json(mockPhishingResponse)
    }

    return HttpResponse.json(mockLegitimateResponse)
  }),
]

// Error handlers for testing error scenarios
export const errorHandlers = {
  networkError: http.post(`${API_URL}/classify`, () => {
    return HttpResponse.error()
  }),

  serverError: http.post(`${API_URL}/classify`, () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }),

  badRequest: http.post(`${API_URL}/classify`, () => {
    return HttpResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }),

  slowResponse: http.post(`${API_URL}/classify`, async () => {
    await delay(3000)
    return HttpResponse.json(mockPhishingResponse)
  }),
}
