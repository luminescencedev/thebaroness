import { useId, type ComponentProps } from "react";

/**
 * Emblème de The Baroness : un trou de serrure (Deadlock) dont l'orifice est un œil
 * qui suit les parties (le tracker). Un seul aplat blanc sur un badge dégradé, lisible dès 16 px.
 */
export function Emblem({
  size = 40,
  className,
  ...rest
}: { size?: number } & Omit<ComponentProps<"svg">, "width" | "height">) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      role={rest["aria-hidden"] ? undefined : "img"}
      aria-label={rest["aria-hidden"] ? undefined : "The Baroness"}
      {...rest}
    >
      <defs>
        <linearGradient
          id={`${id}-bg`}
          x1="4"
          y1="2"
          x2="36"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#a592ff" />
          <stop offset="0.55" stopColor="#7358f5" />
          <stop offset="1" stopColor="#e062d4" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill={`url(#${id}-bg)`} />
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="39"
        rx="11.5"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.28"
      />
      {/* Serrure : orifice rond + fût évasé */}
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M20 7.5a8.5 8.5 0 0 0-3.6 16.2L14.2 32a1.2 1.2 0 0 0 1.16 1.5h9.28a1.2 1.2 0 0 0 1.16-1.5l-2.2-8.3A8.5 8.5 0 0 0 20 7.5Zm0 5.2a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6Z"
      />
    </svg>
  );
}
