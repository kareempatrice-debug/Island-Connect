import { isOpenNow } from "@/lib/format";
import type { OpeningHours } from "@/lib/types";

export function OpenStatus({ hours, timeZone, className = "" }: { hours: OpeningHours[]; timeZone: string; className?: string }) {
  if (!hours.length) return null;
  const open = isOpenNow(hours, timeZone);
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${open ? "text-success" : "text-muted"} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${open ? "bg-success" : "bg-muted/50"}`} aria-hidden="true" />
      {open ? "Open now" : "Closed now"}
    </span>
  );
}
