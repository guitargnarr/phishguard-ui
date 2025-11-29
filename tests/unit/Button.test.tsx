import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default variant', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('renders with children', () => {
      render(<Button>Test Button</Button>)
      expect(screen.getByText('Test Button')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('custom-class')
    })
  })

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Button variant="default">Default</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-primary')
    })

    it('renders destructive variant', () => {
      render(<Button variant="destructive">Destructive</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-destructive')
    })

    it('renders outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole('button')).toHaveClass('border')
    })

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')
    })
  })

  describe('Sizes', () => {
    it('renders default size', () => {
      render(<Button size="default">Default Size</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-9')
    })

    it('renders small size', () => {
      render(<Button size="sm">Small</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-8')
    })

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-10')
    })
  })

  describe('Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Click me</Button>)
      await user.click(screen.getByRole('button'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick} disabled>Click me</Button>)
      await user.click(screen.getByRole('button'))

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('shows disabled state correctly', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('can be focused with keyboard', async () => {
      const user = userEvent.setup()
      render(<Button>Focusable</Button>)

      await user.tab()
      expect(screen.getByRole('button')).toHaveFocus()
    })

    it('can be activated with Enter key', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Press Enter</Button>)
      const button = screen.getByRole('button')

      button.focus()
      await user.keyboard('{Enter}')

      expect(handleClick).toHaveBeenCalled()
    })

    it('can be activated with Space key', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Press Space</Button>)
      const button = screen.getByRole('button')

      button.focus()
      await user.keyboard(' ')

      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('asChild prop', () => {
    it('renders as child element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )

      const link = screen.getByRole('link', { name: 'Link Button' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })
  })
})
