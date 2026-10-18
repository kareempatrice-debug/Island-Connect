"use client";

/* Shown instead of a blank error screen if a page fails to load. */
export default function PageError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <h1 className="text-3xl font-semibold">Something went wrong loading this page</h1>
      <p className="mt-3">Please try again in a moment. If it keeps happening, the site’s setup may need checking.</p>
      <button onClick={reset} className="mt-6 h-12 rounded-full bg-primary px-6 font-semibold text-primary-ink">Try again</button>
    </main>
  );
}
