/** Courbe lissée (Catmull-Rom vers Bézier), comme dans les maquettes. Valeurs normalisées sur [min, max]. */
export function smoothPath(
  values: number[],
  w: number,
  h: number,
  pad = 3,
  min = Math.min(...values),
  max = Math.max(...values),
): { line: string; area: string } {
  const n = values.length;
  if (n < 2) return { line: "", area: "" };
  const span = max - min || 1;
  const pts = values.map((v, i): [number, number] => [
    i * (w / (n - 1)),
    h - pad - ((v - min) / span) * (h - 2 * pad),
  ]);
  const at = (i: number) => pts[Math.min(n - 1, Math.max(0, i))] as [number, number];
  let d = `M${at(0)[0].toFixed(1)} ${at(0)[1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]!.toFixed(1)} ${c1[1]!.toFixed(1)} ${c2[0]!.toFixed(1)} ${c2[1]!.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return { line: d, area: `${d} L${w} ${h} L0 ${h} Z` };
}
