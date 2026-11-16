import { WheelEye, WheelRing } from "./wheel";

interface MedallionProps {
  size?: number;
  /** « white » : tout en blanc, iris violet, pour poser sur un fond violet. */
  variant?: "color" | "white";
  className?: string;
  title?: string;
}

/** Médaillon seul et statique : footer, favicon, avatars de partage. */
export function Medallion({ size = 26, variant = "color", className, title }: MedallionProps) {
  const white = variant === "white";
  const ink = white ? "#fff" : "#B4ABFF";
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g transform="translate(16 16) scale(2.6)">
        <circle r="6.1" fill={ink} fillOpacity=".07" />
        <WheelRing stroke={ink} />
        <WheelEye ink={ink} iris={white ? "#4A3BD8" : "#0b0c10"} />
      </g>
    </svg>
  );
}
