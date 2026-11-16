/** Barre K, D, A proportionnelle aux totaux. */
export function StackedKDA({ k, d, a }: { k: number; d: number; a: number }) {
  const total = k + d + a || 1;
  const seg = [
    ["K", k, "var(--k)"],
    ["D", d, "var(--d)"],
    ["A", a, "var(--a)"],
  ] as const;
  return (
    <div role="img" aria-label={`Éliminations ${k}, morts ${d}, assistances ${a}`}>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {seg.map(([l, v, c]) => (
          <span key={l} style={{ width: `${(v / total) * 100}%`, background: c }} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted tabular-nums">
        {seg.map(([l, v, c]) => (
          <span key={l} className="flex items-center gap-1">
            <span className="size-1.5 rounded-full" style={{ background: c }} aria-hidden="true" />
            {l} {v}
          </span>
        ))}
      </div>
    </div>
  );
}
