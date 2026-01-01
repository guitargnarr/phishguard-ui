'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, Loader2, Send } from 'lucide-react'

function ContactFormInner() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })

  // Pre-fill message if coming from threat alert
  useEffect(() => {
    const source = searchParams.get('source')
    const demo = searchParams.get('demo')

    if (demo === 'true' && source === 'threat-alert') {
      setFormData(prev => ({
        ...prev,
        message: 'I detected a high-risk phishing email using PhishGuard and would like to learn more about enterprise protection for my organization.'
      }))
      // Scroll to contact form
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to submit')
      }

      setSubmitted(true)
    } catch {
      // Fallback to mailto if API fails
      const subject = encodeURIComponent(`PhishGuard Demo Request - ${formData.company}`)
      const body = encodeURIComponent(
        `Name: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Company: ${formData.company}\n\n` +
        `Message:\n${formData.message}`
      )
      window.location.href = `mailto:matthewdscott7@gmail.com?subject=${subject}&body=${body}`
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-center space-y-4 py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold text-white">Thank You!</h3>
            <p className="text-slate-300">
              Your demo request has been received. I&apos;ll be in touch within 24 hours.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="name" className="text-slate-300">Name</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="text-slate-300">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="company" className="text-slate-300">Company</Label>
            <Input
              id="company"
              placeholder="Acme Corp"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="message" className="text-slate-300">
              What security challenges are you facing?
            </Label>
            <Textarea
              id="message"
              placeholder="Tell us about your email security needs..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-700 hover:bg-teal-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Request Demo
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Wrapper with Suspense for useSearchParams
export function ContactForm() {
  return (
    <Suspense fallback={
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-700 rounded"></div>
            <div className="h-10 bg-slate-700 rounded"></div>
            <div className="h-20 bg-slate-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    }>
      <ContactFormInner />
    </Suspense>
  )
}
