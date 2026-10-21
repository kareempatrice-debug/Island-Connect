/*
 * Fare estimates for taxi routes with no published fare.
 *
 * Fitted to the official fares against real road distances (Island Connect, October 2026):
 *   Grenada: EC$27 + EC$2.85 per km   (8 official routes, typical error 5%)
 *   SVG:     EC$25 + EC$3.97 per km   (9 official routes, typical error 3%)
 * Both are per taxi for up to 3 passengers; SVG's published EC$13 per extra passenger is added.
 * Shown as a range, because the driver confirms the actual price.
 */
const MODEL: Record<string, { base: number; perKm: number; extraPassenger: number }> = {
  gd: { base: 27, perKm: 2.85, extraPassenger: 0 },
  vc: { base: 25.3, perKm: 3.97, extraPassenger: 13 },
};
const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

export function estimateFare(country: string, km: number | null | undefined, passengers = 1): { low: number; high: number } | null {
  const m = MODEL[country];
  if (!m || km == null || !Number.isFinite(km) || km <= 0 || km > 120) return null;
  const mid = m.base + m.perKm * km + Math.max(0, passengers - 3) * m.extraPassenger;
  return { low: round5(mid * 0.88), high: round5(mid * 1.12) };
}
