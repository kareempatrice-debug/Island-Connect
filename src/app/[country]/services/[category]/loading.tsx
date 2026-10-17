import { CardSkeleton } from "@/components/business-card";
import { Container } from "@/components/ui";

export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading results">
      <div className="h-28 bg-deep" />
      <Container className="pt-8">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <CardSkeleton />
            </li>
          ))}
        </ul>
      </Container>
    </main>
  );
}
