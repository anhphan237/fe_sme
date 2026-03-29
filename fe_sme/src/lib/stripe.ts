import { loadStripe } from "@stripe/stripe-js";

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

export const stripePromise = loadStripe(STRIPE_KEY);

export const isValidStripeSecret = (s: string): boolean =>
  s.startsWith("pi_") &&
  s.includes("_secret_") &&
  !s.toLowerCase().includes("mock");
