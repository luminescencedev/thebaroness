import type { RankTier } from "@/api";
import { downsample } from "@/lib/stats";
import { MultiLineChart, type Series } from "./MultiLineChart";

export interface RankSeries {
  key: string;
  label: string;
  color: string;
  points: { at: string; score: number }[];
}

/** Courbes de score de rang (tier * 6 + sous-rang), échantillonnées à 120 points maximum. */
export function RankProgress({
  series,
  ranks,
  title,
}: {
  series: RankSeries[];
  ranks: RankTier[] | undefined;
  title: string;
}) {
  const label = (score: number) => {
    const tier = Math.floor((score - 1) / 6);
    return `${ranks?.find((r) => r.tier === tier)?.name ?? `Rang ${tier}`} ${score - tier * 6}`;
  };
  const sampled: Series[] = series
    .filter((s) => s.points.length > 1)
    .map((s) => ({
      key: s.key,
      label: s.label,
      color: s.color,
      points: downsample(s.points, 120).map((p) => ({ at: Date.parse(p.at), value: p.score })),
    }));
  return <MultiLineChart series={sampled} title={title} format={(v) => label(Math.round(v))} />;
}
