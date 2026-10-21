import * as Sentry from "@sentry/nextjs";

/*
 * Error monitoring (Sentry). Only runs when NEXT_PUBLIC_SENTRY_DSN is set, so the site works
 * exactly the same without it. No personal data is sent (Sentry's default), and no performance
 * tracing, to stay within the free plan.
 */
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({ dsn, environment: process.env.CONTEXT ?? process.env.NODE_ENV, tracesSampleRate: 0 });
}

export const onRequestError = Sentry.captureRequestError;
