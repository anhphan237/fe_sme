import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string

type Status = 'loading' | 'succeeded' | 'processing' | 'failed'

function PaymentConfirmation() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('loading')

  const clientSecret = searchParams.get('payment_intent_client_secret')
  const stripePromise = useMemo(() => loadStripe(STRIPE_KEY), [])

  useEffect(() => {
    if (!clientSecret) {
      setStatus('failed')
      return
    }

    stripePromise.then(async (stripe) => {
      if (!stripe) {
        setStatus('failed')
        return
      }

      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret)

      switch (paymentIntent?.status) {
        case 'succeeded':
          setStatus('succeeded')
          break
        case 'processing':
          setStatus('processing')
          break
        default:
          setStatus('failed')
          break
      }
    })
  }, [clientSecret, stripePromise])

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Payment Result" subtitle="" />

      <Card className="text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <Skeleton className="mx-auto h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto h-6 w-48" />
            <Skeleton className="mx-auto h-4 w-64" />
          </div>
        )}

        {status === 'succeeded' && (
          <div className="space-y-4 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ink">Payment Successful</h2>
            <p className="text-sm text-muted">
              Your payment has been processed successfully. The invoice status will be updated shortly.
            </p>
          </div>
        )}

        {status === 'processing' && (
          <div className="space-y-4 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <svg className="h-8 w-8 animate-spin text-yellow-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ink">Payment Processing</h2>
            <p className="text-sm text-muted">
              Your payment is being processed. We&apos;ll update the invoice status once confirmed.
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-4 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ink">Payment Failed</h2>
            <p className="text-sm text-muted">
              Something went wrong with your payment. Please try again or use a different payment method.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/billing/invoices')}>
            Back to Invoices
          </Button>
          {status === 'failed' && (
            <Button onClick={() => navigate(-1)}>
              Try Again
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

export default PaymentConfirmation
