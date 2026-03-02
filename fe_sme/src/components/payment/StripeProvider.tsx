import { type ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";

interface StripeProviderProps {
  clientSecret: string;
  children: ReactNode;
}

export function StripeProvider({
  clientSecret,
  children,
}: StripeProviderProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            borderRadius: "12px",
            fontFamily: "Inter, system-ui, sans-serif",
          },
        },
      }}>
      {children}
    </Elements>
  );
}
