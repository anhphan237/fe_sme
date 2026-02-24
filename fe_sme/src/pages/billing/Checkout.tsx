import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { StripeProvider } from '../../components/payment/StripeProvider'
import { CheckoutForm } from '../../components/payment/CheckoutForm'
import { useCreatePaymentIntent } from '../../hooks/queries'
import { useEffect, useState } from 'react'
import { useToast } from '../../components/ui/Toast'

function BillingCheckout() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const addToast = useToast()
  const createIntent = useCreatePaymentIntent()
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const amount = searchParams.get('amount') ?? '$0.00'

  useEffect(() => {
    if (!invoiceId) return
    createIntent.mutate(invoiceId, {
      onSuccess: (data) => {
        setClientSecret(data.clientSecret)
      },
      onError: (err) => {
        addToast(`Failed to initialize payment: ${err.message}`)
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId])

  const returnUrl = `${window.location.origin}/billing/payment/confirmation`

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Checkout"
        subtitle={`Complete payment for Invoice #${invoiceId}`}
      />

      <Card>
        {createIntent.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-40" />
            <Skeleton className="h-10" />
          </div>
        ) : createIntent.isError ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-red-600">
              Could not create payment session. Please try again.
            </p>
            <Button variant="secondary" onClick={() => navigate('/billing/invoices')}>
              Back to Invoices
            </Button>
          </div>
        ) : clientSecret ? (
          <StripeProvider clientSecret={clientSecret}>
            <CheckoutForm
              amount={amount}
              invoiceId={invoiceId ?? ''}
              returnUrl={returnUrl}
              onError={(msg) => addToast(msg)}
            />
          </StripeProvider>
        ) : null}
      </Card>

      <div className="text-center">
        <Button variant="ghost" onClick={() => navigate('/billing/invoices')}>
          Cancel and return to Invoices
        </Button>
      </div>
    </div>
  )
}

export default BillingCheckout
