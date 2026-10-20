/* Lightweight charts drawn as SVG on the server: no chart library, nothing for phones to download. */

const COLORS = ["#07565A", "#F4B846", "#EB6955", "#5B8DEF", "#7A9E3B"];

export function Stat({ label, value, previous, hint }: { label: string; value: number | string; previous?: number; hint?: string }) {
  const n = typeof value === "number" ? value : null;
  const change = n != null && previous != null ? (previous === 0 ? (n > 0 ? 100 : 0) : Math.round(((n - previous) / previous) * 100)) : null;
  return (
    <div className="rounded-2xl bg-raised p-4 ring-1 ring-line/60">
      <p className="text-sm">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{typeof value === "number" ? value.toLocaleString("en-GB") : value}</p>
      {change != null && (
        <p className={`mt-0.5 text-xs font-semibold ${change > 0 ? "text-success" : change < 0 ? "text-danger" : "text-muted"}`}>
          {change > 0 ? "▲" : change < 0 ? "▼" : "■"} {Math.abs(change)}% vs previous period
        </p>
      )}
      {hint && <p className="mt-0.5 text-xs">{hint}</p>}
    </div>
  );
}

export function LineChart({ title, labels, series, height = 180 }: {
  title: string; labels: string[]; series: { name: string; values: number[] }[]; height?: number;
}) {
  const W = 640, H = height + 40, P = { l: 52, r: 16, t: 14, b: 40 };
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const nice = max <= 5 ? 5 : max <= 10 ? 10 : Math.ceil(max / 5) * 5;
  const x = (i: number) => P.l + (labels.length <= 1 ? 0 : (i / (labels.length - 1)) * (W - P.l - P.r));
  const y = (v: number) => H - P.b - (v / nice) * (H - P.t - P.b);
  const ticks = [0, nice / 2, nice];
  const every = Math.ceil(labels.length / 4);
  return (
    <figure className="rounded-2xl bg-raised p-4 ring-1 ring-line/60">
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-ink">{title}</span>
        <span className="flex flex-wrap gap-3 text-xs">
          {series.map((s, i) => <span key={s.name} className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />{s.name}</span>)}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-auto w-full" role="img" aria-label={`${title}: ${series.map((s) => `${s.name} total ${s.values.reduce((a, b) => a + b, 0)}`).join(", ")}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="stroke-line" strokeDasharray={t ? "3 4" : undefined} />
            <text x={P.l - 6} y={y(t) + 4} textAnchor="end" className="fill-muted text-[22px]">{t}</text>
          </g>
        ))}
        {labels.map((l, i) => (i % every === 0 || i === labels.length - 1) && (
          <text key={i} x={x(i)} y={H - 10} textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"} className="fill-muted text-[22px]">{l}</text>
        ))}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
          return (
            <g key={s.name}>
              {si === 0 && <path d={`M${x(0)},${y(0)} L${pts.join(" L")} L${x(s.values.length - 1)},${y(0)} Z`} fill={COLORS[0]} opacity={0.08} />}
              <polyline points={pts.join(" ")} fill="none" stroke={COLORS[si % COLORS.length]} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export function BarList({ title, items, empty = "Nothing yet." }: { title: string; items: { label: string; value: number }[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="rounded-2xl bg-raised p-4 ring-1 ring-line/60">
      <p className="font-semibold text-ink">{title}</p>
      {!items.length ? <p className="mt-2 text-sm">{empty}</p> : (
        <ul className="mt-3 space-y-2">
          {items.map((it) => (
            <li key={it.label}>
              <div className="flex justify-between gap-3 text-sm"><span className="truncate text-ink">{it.label}</span><span className="font-semibold text-ink">{it.value.toLocaleString("en-GB")}</span></div>
              <div className="mt-1 h-2 rounded-full bg-sunken"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(3, (it.value / max) * 100)}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Booking funnel: requests → booked → completed. */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <div className="rounded-2xl bg-raised p-4 ring-1 ring-line/60">
      <p className="font-semibold text-ink">Booking funnel</p>
      <ol className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <li key={s.label}>
            <div className="flex justify-between text-sm"><span className="text-ink">{s.label}</span>
              <span className="font-semibold text-ink">{s.value}{i > 0 && steps[0].value ? ` · ${Math.round((s.value / top) * 100)}%` : ""}</span></div>
            <div className="mt-1 h-3 rounded-full bg-sunken"><div className="h-3 rounded-full" style={{ width: `${Math.max(2, (s.value / top) * 100)}%`, background: COLORS[i % COLORS.length] }} /></div>
          </li>
        ))}
      </ol>
    </div>
  );
}
