"use client";
export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-ink">Print</button>;
}
