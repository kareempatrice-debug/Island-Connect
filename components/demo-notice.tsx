import { DatabaseZap } from "lucide-react";

/** Shown on pages that need a real database when the app runs in demo mode. */
export function NeedsDatabase({ feature }: { feature: string }) {
  return (
    <div className="rounded-panel border border-dashed border-line bg-raised/70 p-6 text-center">
      <DatabaseZap className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
      <h2 className="mt-3 text-xl font-semibold">{feature} needs the database connected</h2>
      <p className="mx-auto mt-2 max-w-md">This preview runs on demonstration data. Once Supabase is connected (see the README), this works for real.</p>
    </div>
  );
}
