import * as Sentry from "@sentry/nextjs";

// Errors in people's browsers (see src/instrumentation.ts for the server side).
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0,
    // Browser extensions and blocked third-party scripts cause noise that isn't ours to fix.
    ignoreErrors: ["ResizeObserver loop", "Non-Error promise rejection captured", "Load failed", "NetworkError when attempting to fetch resource"],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
