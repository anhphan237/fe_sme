/**
 * Case 1 — Register & Pay: inline payment navigation.
 *
 * When a card payment completes inline (no Stripe browser redirect), the
 * `onSuccess` callback in RegisterStepPayment must navigate to
 * /billing/payment/confirmation with all params that Stripe would append on a
 * normal redirect.  This ensures the success screen is always shown before the
 * user reaches the dashboard.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IntlProvider } from 'react-intl'
import type { PropsWithChildren, ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { RegisterStepPayment } from '../../pages/auth/components/RegisterStepPayment'
import enUS from '../../i18n/languages/en-US.json'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...mod,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/lib/stripe', () => ({
  stripePromise: Promise.resolve({}),
  isValidStripeSecret: (s: string) =>
    s.startsWith('pi_') && s.includes('_secret_'),
}))

// Mock StripeProvider to render children directly (no real Stripe context needed)
vi.mock('@/components/payment/StripeProvider', () => ({
  StripeProvider: ({ children }: PropsWithChildren) => <>{children}</>,
}))

// Mock CheckoutForm so we can manually trigger onSuccess
const mockOnSuccessRef = { current: (_data: { paymentIntentId: string }) => {} }

vi.mock('@/components/payment/CheckoutForm', () => ({
  CheckoutForm: ({
    onSuccess,
  }: {
    onSuccess?: (data: { paymentIntentId: string }) => void
    [key: string]: unknown
  }) => {
    mockOnSuccessRef.current = onSuccess ?? (() => {})
    return (
      <button
        data-testid="pay-btn"
        onClick={() => onSuccess?.({ paymentIntentId: 'pi_test_inline_001' })}>
        Pay
      </button>
    )
  },
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

const CLIENT_SECRET = 'pi_test_inline_001_secret_abc'
const INVOICE_ID = 'INV-2025-TEST'

function renderWithIntl(ui: ReactElement) {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <IntlProvider locale="en" messages={enUS as Record<string, string>}>
      <MemoryRouter>{children}</MemoryRouter>
    </IntlProvider>
  )
  return render(ui, { wrapper: Wrapper })
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('RegisterStepPayment — Case 1 inline payment', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('navigates to /billing/payment/confirmation with correct params on inline success', async () => {
    renderWithIntl(
      <RegisterStepPayment
        clientSecret={CLIENT_SECRET}
        invoiceId={INVOICE_ID}
        amount="499,000 ₫"
        planName="Starter"
        billingCycle="MONTHLY"
        onError={() => {}}
      />,
    )

    await userEvent.click(screen.getByTestId('pay-btn'))

    expect(mockNavigate).toHaveBeenCalledOnce()
    const [path, opts] = mockNavigate.mock.calls[0] as [string, { replace?: boolean }]

    // Must replace history so back-button doesn't go back to step 4 form
    expect(opts?.replace).toBe(true)

    const url = new URL(path, 'http://localhost')
    expect(url.pathname).toBe('/billing/payment/confirmation')

    const params = url.searchParams
    expect(params.get('from')).toBe('register')
    expect(params.get('invoiceId')).toBe(INVOICE_ID)
    expect(params.get('payment_intent')).toBe('pi_test_inline_001')
    expect(params.get('payment_intent_client_secret')).toBe(CLIENT_SECRET)
    expect(params.get('redirect_status')).toBe('succeeded')
  })

  it('does NOT navigate when clientSecret is invalid', () => {
    // isValidStripeSecret('mock_secret') returns false — shows a warning UI instead
    renderWithIntl(
      <RegisterStepPayment
        clientSecret="mock_invalid"
        invoiceId={INVOICE_ID}
        amount="499,000 ₫"
        onError={() => {}}
      />,
    )

    // The payment form should not render; a warning message is shown instead
    expect(screen.queryByTestId('pay-btn')).not.toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
