import { Check } from "lucide-react";

/* The customer's view of where their ride is up to, at a glance. */
export function TripProgress({ status, pickedUp, reach, createdAt, fixed, dispatch }: {
  status: string; pickedUp: boolean; reach: number | null; createdAt: string; fixed: boolean;
  dispatch?: { state: string | null; tried: number; current_km: number | null } | null;
}) {
  const steps = ["Requested", "Driver confirmed", "Picked up", "Arrived"];
  const at = status === "completed" ? 4 : pickedUp ? 3 : status === "booked" ? 2 : 1;
  const mins = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
  const headline =
    status === "cancelled" ? "Request cancelled"
    : status === "expired" ? "No driver took this request"
    : status === "completed" ? "Trip complete"
    : pickedUp ? "On your way"
    : status === "booked" ? "Your driver is confirmed"
    : fixed ? "Finding your driver" : "Waiting for drivers’ prices";
  const offering = status === "open" && dispatch?.state === "dispatching";
  const sub =
    offering ? (dispatch?.current_km != null
      ? `Offering your ride to the nearest driver, ${Number(dispatch.current_km).toFixed(1)} km away.${dispatch.tried > 1 ? ` (${dispatch.tried} drivers asked so far)` : ""}`
      : "Finding the nearest available driver…")
    : status === "open" ? (reach === 0
      ? "No approved drivers cover this trip yet. Try the drivers listed under “Contact a driver directly”, or we’ll keep it open."
      : `Sent to ${reach ?? "approved"} driver${reach === 1 ? "" : "s"} ${mins < 1 ? "just now" : `${mins} min ago`}. This page updates by itself.`)
    : status === "booked" && !pickedUp ? "Give your driver the pick-up PIN below when they arrive."
    : "";
  if (status === "cancelled" || status === "expired") {
    return <section className="mb-6 rounded-2xl bg-sunken p-5"><p className="text-lg font-bold text-ink">{headline}</p></section>;
  }
  return (
    <section className="mb-6 rounded-2xl bg-deep p-5 text-white" aria-live="polite">
      <div className="flex items-center gap-3">
        {status === "open" && <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-gold" /></span>}
        <p className="text-xl font-bold">{headline}</p>
      </div>
      {sub && <p className="mt-1 text-sm text-white/85">{sub}</p>}
      <ol className="mt-4 grid grid-cols-4 gap-1">
        {steps.map((label, i) => {
          const done = i + 1 < at || status === "completed";
          const now = i + 1 === at && status !== "completed";
          return (
            <li key={label} className="flex flex-col items-center gap-1.5 text-center">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-gold text-[#172B32]" : now ? "bg-white text-deep" : "bg-white/15 text-white/70"}`}>
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span className={`text-[0.7rem] leading-tight ${done || now ? "text-white" : "text-white/60"}`}>{label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
