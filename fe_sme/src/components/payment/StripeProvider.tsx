import { type ReactNode, useMemo } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string

interface StripeProviderProps {
  clientSecret: string
  children: ReactNode
}

export function StripeProvider({ clientSecret, children }: StripeProviderProps) {
  const stripePromise = useMemo(() => loadStripe(STRIPE_KEY), [])

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            borderRadius: '12px',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        },
      }}
    >
      {children}
    </Elements>
  )
}
