/**
 * Stripe promise singleton.
 *
 * loadStripe() MUST be called at module level (outside any component),
 * not inside useMemo/useEffect, to ensure:
 *  1. The Stripe.js script is loaded exactly once per session.
 *  2. Only one Stripe instance is created — no duplicate fraud-detection
 *     calls to r.stripe.com / m.stripe.com on every component mount.
 *
 * This module is in a lazy-loaded chunk (imported only by billing pages
 * and the register-company flow), so Stripe.js is NOT loaded until those
 * pages are actually visited.
 *
 * @see https://stripe.com/docs/stripe-js/react#elements-provider
 */
import { loadStripe } from "@stripe/stripe-js";

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

export const stripePromise = loadStripe(STRIPE_KEY);

/**
 * Validates that a string is a real Stripe client secret (pi_xxx_secret_yyy)
 * and not a mock/test placeholder that would crash the Stripe Elements SDK.
 */
export const isValidStripeSecret = (s: string): boolean =>
  s.startsWith("pi_") &&
  s.includes("_secret_") &&
  !s.toLowerCase().includes("mock");
