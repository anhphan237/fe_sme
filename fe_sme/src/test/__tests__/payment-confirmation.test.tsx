import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { IntlProvider } from 'react-intl'
import type { PropsWithChildren, ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { server } from '../server'
import PaymentConfirmation from '../../pages/billing/PaymentConfirmation'
import enUS from '../../i18n/languages/en-US.json'

// ── Stripe mock ────────────────────────────────────────────────────────────────
// vi.mock is hoisted — use vi.hoisted() so the variable is available inside the factory
const { mockRetrievePaymentIntent } = vi.hoisted(() => ({
  mockRetrievePaymentIntent: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
  stripePromise: Promise.resolve({
    retrievePaymentIntent: mockRetrievePaymentIntent,
  }),
  isValidStripeSecret: (s: string) =>
    s.startsWith('pi_') && s.includes('_secret_') && !s.includes('mock'),
}))

// ── Render helper that includes IntlProvider ───────────────────────────────────
function renderWithIntl(ui: ReactElement, route = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: PropsWithChildren) => (
    <IntlProvider locale="en" messages={enUS as Record<string, string>}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </IntlProvider>
  )
  return render(ui, { wrapper: Wrapper })
}

// ── Constants ──────────────────────────────────────────────────────────────────
const PAYMENT_INTENT_ID = 'pi_test_abc123'
const CLIENT_SECRET = 'pi_test_abc123_secret_xyz'
const INVOICE_ID = 'INV-2025-001'

/** Build the URL that Stripe appends its params to after redirect */
const makeConfirmationUrl = (extraParams: Record<string, string> = {}) => {
  const params = new URLSearchParams({
    payment_intent: PAYMENT_INTENT_ID,
    payment_intent_client_secret: CLIENT_SECRET,
    redirect_status: 'succeeded',
    invoiceId: INVOICE_ID,
    ...extraParams,
  })
  return `/billing/payment/confirmation?${params.toString()}`
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Intercept every gateway POST and collect request bodies */
const captureGatewayBodies = () => {
  const captured: unknown[] = []
  server.use(
    http.post('/api/v1/gateway', async ({ request }) => {
      const body = await request.json()
      captured.push(body)
      return HttpResponse.json({ data: { ok: true } })
    }),
  )
  return captured
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('PaymentConfirmation — Case 1 (Register & Pay)', () => {
  beforeEach(() => {
    mockRetrievePaymentIntent.mockResolvedValue({
      paymentIntent: { status: 'succeeded' },
    })
  })

  it('shows success UI after payment succeeds', async () => {
    renderWithIntl(<PaymentConfirmation />, makeConfirmationUrl({ from: 'register' }))

    expect(await screen.findByText('Payment successful')).toBeInTheDocument()
  })

  it('calls apiGetPaymentStatus with BOTH paymentIntentId AND invoiceId', async () => {
    const bodies = captureGatewayBodies()

    renderWithIntl(<PaymentConfirmation />, makeConfirmationUrl({ from: 'register' }))

    await waitFor(() => {
      const statusCall = (bodies as Array<{ operationType?: string; payload?: unknown }>).find(
        (b) => b.operationType === 'com.sme.billing.payment.status',
      )
      expect(statusCall).toBeDefined()
      expect(statusCall?.payload).toMatchObject({
        paymentIntentId: PAYMENT_INTENT_ID,
        invoiceId: INVOICE_ID,
      })
    })
  })

  it('shows auto-redirect countdown for register flow', async () => {
    renderWithIntl(<PaymentConfirmation />, makeConfirmationUrl({ from: 'register' }))

    // i18n: "Redirecting to dashboard in {sec}s…" — sec is interpolated as a number
    await waitFor(() => {
      expect(screen.getByText(/Redirecting to dashboard in \d+s/)).toBeInTheDocument()
    })
  })
})

describe('PaymentConfirmation — Case 2 (Plan Change)', () => {
  beforeEach(() => {
    mockRetrievePaymentIntent.mockResolvedValue({
      paymentIntent: { status: 'succeeded' },
    })
  })

  it('shows success UI with Manage invoices button (no auto-redirect)', async () => {
    renderWithIntl(<PaymentConfirmation />, makeConfirmationUrl())

    expect(await screen.findByText('Payment successful')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Manage invoices' })).toBeInTheDocument()
  })

  it('calls apiGetPaymentStatus with both ids for plan change', async () => {
    const bodies = captureGatewayBodies()

    renderWithIntl(<PaymentConfirmation />, makeConfirmationUrl())

    await waitFor(() => {
      const statusCall = (bodies as Array<{ operationType?: string; payload?: unknown }>).find(
        (b) => b.operationType === 'com.sme.billing.payment.status',
      )
      expect(statusCall).toBeDefined()
      expect(statusCall?.payload).toMatchObject({
        paymentIntentId: PAYMENT_INTENT_ID,
        invoiceId: INVOICE_ID,
      })
    })
  })
})

describe('PaymentConfirmation — failed payment', () => {
  it('shows failed UI when redirect_status indicates failure', async () => {
    // Stripe never sends "failed"; it sends "requires_payment_method"
    mockRetrievePaymentIntent.mockResolvedValue({
      paymentIntent: { status: 'requires_payment_method' },
    })

    const params = new URLSearchParams({
      payment_intent: PAYMENT_INTENT_ID,
      payment_intent_client_secret: CLIENT_SECRET,
      redirect_status: 'requires_payment_method',
      invoiceId: INVOICE_ID,
    })
    renderWithIntl(
      <PaymentConfirmation />,
      `/billing/payment/confirmation?${params.toString()}`,
    )

    expect(await screen.findByText('Payment failed')).toBeInTheDocument()
  })

  it('shows failed UI immediately when no clientSecret in URL', async () => {
    renderWithIntl(<PaymentConfirmation />, '/billing/payment/confirmation')

    // No clientSecret → immediate failed state (no async retrieval needed)
    expect(await screen.findByText('Payment failed')).toBeInTheDocument()
  })
})

