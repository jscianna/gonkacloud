import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  if (!stripe) {
    stripe = new Stripe(secretKey, {
      // Use the SDK default pinned API version (avoids TS mismatch when Stripe updates their type literal).
    });
  }

  return stripe;
}
