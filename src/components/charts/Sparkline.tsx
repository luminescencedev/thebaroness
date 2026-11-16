import { smoothPath } from "./smooth";

/** Mini courbe décorative ou de tendance, sans axe. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const { line, area } = smoothPath(values, 120, 28, 3);
  return (
    <svg
      viewBox="0 0 120 28"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className ?? "h-7 w-full"}
    >
      <path d={area} fill="#5B4BF0" fillOpacity="0.16" />
      <path
        d={line}
        fill="none"
        stroke="#9D90FF"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
