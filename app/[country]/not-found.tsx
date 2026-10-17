import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-content px-5 py-20">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-3 max-w-md">The listing or page may have moved, or the link may be mistyped.</p>
      <Link href="/?choose=1" className="mt-6 inline-block font-bold text-primary hover:underline">
        Choose a country
      </Link>
    </main>
  );
}
