import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhishGuardForm } from '@/app/components/PhishGuardForm'
import { server } from '../mocks/server'
import { errorHandlers, mockPhishingResponse, mockLegitimateResponse } from '../mocks/handlers'

describe('PhishGuardForm', () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  describe('Rendering', () => {
    it('renders the form with all required elements', () => {
      render(<PhishGuardForm />)

      // Title and description
      expect(screen.getByText('Email Security Check')).toBeInTheDocument()
      expect(screen.getByText(/Paste suspicious email content/)).toBeInTheDocument()

      // Form elements
      expect(screen.getByLabelText('Email content to analyze')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Check for Phishing/i })).toBeInTheDocument()

      // Example buttons
      expect(screen.getByRole('button', { name: /Try Phishing Example/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Try Safe Example/i })).toBeInTheDocument()
    })

    it('submit button is disabled when textarea is empty', () => {
      render(<PhishGuardForm />)

      const submitButton = screen.getByRole('button', { name: /Check for Phishing/i })
      expect(submitButton).toBeDisabled()
    })

    it('submit button is enabled when textarea has content', async () => {
      const user = userEvent.setup()
      render(<PhishGuardForm />)

      const textarea = screen.getByLabelText('Email content to analyze')
      await user.type(textarea, 'Test email content')

      const submitButton = screen.getByRole('button', { name: /Check for Phishing/i })
      expect(submitButton).toBeEnabled()
    })
  })

  describe('Example Buttons', () => {
    it('fills textarea with phishing example when clicking phishing button', async () => {
      const user = userEvent.setup()
      render(<PhishGuardForm />)

      const phishingButton = screen.getByRole('button', { name: /Try Phishing Example/i })
      await user.click(phishingButton)

      const textarea = screen.getByLabelText('Email content to analyze') as HTMLTextAreaElement
      expect(textarea.value).toContain('URGENT')
      expect(textarea.value).toContain('Account Has Been Suspended')
    })

    it('fills textarea with legitimate example when clicking safe button', async () => {
      const user = userEvent.setup()
      render(<PhishGuardForm />)

      const safeButton = screen.getByRole('button', { name: /Try Safe Example/i })
      await user.click(safeButton)

      const textarea = screen.getByLabelText('Email content to analyze') as HTMLTextAreaElement
      expect(textarea.value).toContain('Order #12345 Has Shipped')
      expect(textarea.value).toContain('Great news')
    })

    it('clears previous results when clicking example button', async () => {
      const user = userEvent.setup()
      render(<PhishGuardForm />)

      // First submit a form to get results
      const textarea = screen.getByLabelText('Email content to analyze')
      await user.type(textarea, 'URGENT: Click here to verify')
      await user.click(screen.getByRole('button', { name: /Check for Phishing/i }))

      await waitFor(() => {
        expect(screen.getByText('Phishing Detected')).toBeInTheDocument()
      })

      // Click example button should clear results
      await user.click(screen.getByRole('button', { name: /Try Safe Example/i }))

      expect(screen.queryByText('Phishing Detected')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('shows loading state during API call', async () => {
      const user = userEvent.setup()
      render(<PhishGuardForm />)

      const textarea = screen.getByLabelText('Email content to analyze')
      await user.type(textarea, 'Test email')

      const submitButton = screen.getByRole('button', { name: /Check for Phishing/i })
      await user.click(submitButton)

      expect(screen.getByText('Analyzing...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('displays phishing result correctly', async () => {
      const user = userEvent.setup()
      render(<PhishGuardForm />)

      const textarea = screen.getByLabelText('Email content to analyze')
      await user.type(textarea, 'URGENT: Click here to verify your account')
      await user.click(screen.getByRole('button', { name: /Check for Phishing/i }))

      await waitFor(() => {
        expect(screen.getByText('Phishing Detected')).toBeInTheDocument()
      })

      // Check confidence badge
      expect(screen.getByText(`${(mockPhishingResponse.confidence * 100).toFixed(1)}% confidence`)).toBeInTheDocument()

      // Check classification info
      expect(screen.getByText(/Classification: phishing/)).toBeInTheDocument()

      // Check warning message
      expect(screen.getByText(/This email shows signs of a phishing attempt/)).toBeInTheDocument()
    })

    it('displays legitimate result correctly', async () => {
      const user = userEvent.setup()
      render(<PhishGuardForm />)

      const textarea = screen.getByLabelText('Email content to analyze')
      await user.type(textarea, 'Your order has shipped. Thank you for your purchase.')
      await user.click(screen.getByRole('button', { name: /Check for Phishing/i }))

      await waitFor(() => {
        expect(screen.getByText('Appears Safe')).toBeInTheDocument()
      })

      // Check confidence badge
      expect(screen.getByText(`${(mockLegitimateResponse.confidence * 100).toFixed(1)}% confidence`)).toBeInTheDocument()

      // Check classification info
      expect(screen.getByText(/Classification: legitimate/)).toBeInTheDocument()

      // Warning should NOT be shown
      expect(screen.queryByText(/This email shows signs of a phishing attempt/)).not.toBeInTheDocument()
    })

    it('clears previous results on new submission', async () => {
      const user = userEvent.setup()
      render(<PhishGuardForm />)

      // First submission - phishing
      const textarea = screen.getByLabelText('Email content to analyze')
      await user.type(textarea, 'URGENT: Click here')
      await user.click(screen.getByRole('button', { name: /Check for Phishing/i }))

      await waitFor(() => {
        expect(screen.getByText('Phishing Detected')).toBeInTheDocument()
      })

      // Clear and submit legitimate
      await user.clear(textarea)
      await user.type(textarea, 'Your order has shipped')
      await user.click(screen.getByRole('button', { name: /Check for Phishing/i }))

      await waitFor(() => {
        expect(screen.getByText('Appears Safe')).toBeInTheDocument()
      })

      expect(screen.queryByText('Phishing Detected')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error message on network failure', async () => {
      server.use(errorHandlers.networkError)

      const user = userEvent.setup()
      render(<PhishGuardForm />)

      const textarea = screen.getByLabelText('Email content to analyze')
      await user.type(textarea, 'Test email')
      await user.click(screen.getByRole('button', { name: /Check for Phishing/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('displays error message on server error', async () => {
      server.use(errorHandlers.serverError)

      const user = userEvent.setup()
      render(<PhishGuardForm />)

      const textarea = screen.getByLabelText('Email content to analyze')
      await user.type(textarea, 'Test email')
      await user.click(screen.getByRole('button', { name: /Check for Phishing/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/API error: 500/)).toBeInTheDocument()
      })
    })

    it('clears error on new submission', async () => {
      server.use(errorHandlers.serverError)

      const user = userEvent.setup()
      render(<PhishGuardForm />)

      const textarea = screen.getByLabelText('Email content to analyze')
      await user.type(textarea, 'Test email')
      await user.click(screen.getByRole('button', { name: /Check for Phishing/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Reset handlers to normal
      server.resetHandlers()

      // Submit again
      await user.click(screen.getByRole('button', { name: /Check for Phishing/i }))

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<PhishGuardForm />)

      expect(screen.getByLabelText('Email content to analyze')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Check for Phishing/i })).toHaveAttribute('aria-busy', 'false')
    })

    it('sets aria-busy during loading', async () => {
      const user = userEvent.setup()
      render(<PhishGuardForm />)

      const textarea = screen.getByLabelText('Email content to analyze')
      await user.type(textarea, 'Test email')

      const submitButton = screen.getByRole('button', { name: /Check for Phishing/i })
      await user.click(submitButton)

      expect(submitButton).toHaveAttribute('aria-busy', 'true')
    })

    it('error message has alert role', async () => {
      server.use(errorHandlers.serverError)

      const user = userEvent.setup()
      render(<PhishGuardForm />)

      const textarea = screen.getByLabelText('Email content to analyze')
      await user.type(textarea, 'Test email')
      await user.click(screen.getByRole('button', { name: /Check for Phishing/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})
