import { useEffect, useId, useRef, useState } from "react";
import { ALMOND, WheelRing } from "./wheel";

interface BrandMarkProps {
  size?: number;
  loading?: boolean;
  className?: string;
}

const RADIUS = 150;
const MAX_X = 1.0;
const MAX_Y = 0.25;
const round = (v: number) => Math.round(v / 0.05) * 0.05;
const media = (query: string) =>
  typeof window.matchMedia === "function" && window.matchMedia(query).matches;

/**
 * Marque complète : le chariot du Baroness Hotel portant le médaillon à roue et œil.
 * Animée dans le header et au chargement (jamais sous 24 px). La pupille suit le pointeur
 * quand il passe à moins de 150 px ; tout est coupé sur écran tactile et en mouvement réduit.
 */
export function BrandMark({ size = 30, loading = false, className }: BrandMarkProps) {
  const root = useRef<SVGSVGElement>(null);
  const clipId = useId();
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [anim, setAnim] = useState<"none" | "a" | "b">("none");
  const [blink, setBlink] = useState<"none" | "a" | "b">("none");
  const animate = size >= 24;

  useEffect(() => {
    if (!animate) return;
    const reduce = media("(prefers-reduced-motion: reduce)");
    const touch = media("(pointer: coarse)");
    if (reduce || touch) return;
    const onMove = (e: PointerEvent) => {
      const box = root.current?.getBoundingClientRect();
      if (!box) return;
      const dx = e.clientX - (box.left + box.width / 2);
      const dy = e.clientY - (box.top + box.height / 2);
      const dist = Math.hypot(dx, dy);
      const next =
        dist > RADIUS || dist === 0
          ? { x: 0, y: 0 }
          : {
              x: round((dx / dist) * MAX_X * Math.min(1, dist / 40)),
              y: round((dy / dist) * MAX_Y * Math.min(1, dist / 40)),
            };
      setLook((cur) => (cur.x === next.x && cur.y === next.y ? cur : next));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [animate]);

  const bump = () => {
    if (!animate || media("(prefers-reduced-motion: reduce)")) return;
    setAnim((a) => (a === "a" ? "b" : "a"));
    window.setTimeout(() => setAnim("none"), 700);
  };
  const click = () => {
    bump();
    setBlink((b) => (b === "a" ? "b" : "a"));
    window.setTimeout(() => setBlink("none"), 400);
  };

  return (
    <svg
      ref={root}
      className={`ev ${className ?? ""}`}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      style={{ ["--sx" as string]: "1px", ["--notch" as string]: "45deg" }}
      data-anim={anim}
      data-blink={blink}
      data-loading={loading ? "true" : "false"}
      overflow="visible"
      role="img"
      aria-label="The Baroness"
      onPointerEnter={bump}
      onClick={click}
    >
      <defs>
        <clipPath id={clipId}>
          <circle r="1.45" />
        </clipPath>
      </defs>
      <g
        className="lines"
        stroke="#B4ABFF"
        strokeWidth="1.3"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path className="ln ln1" d="M2.5 12h-3.5" />
        <path className="ln ln2" d="M2 17h-4.5" />
        <path className="ln ln3" d="M2.5 22h-3" />
      </g>
      <g className="rig">
        <circle cx="16" cy="3" r="1.6" fill="#B4ABFF" />
        <path d="M16 4.6V6.2" stroke="#B4ABFF" strokeWidth="1.4" strokeLinecap="round" />
        <path
          d="M7 23.8V13.2C7 8.4 11 6 16 6s9 2.4 9 7.2v10.6"
          fill="none"
          stroke="#B4ABFF"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path d="M7 13h2M25 13h-2" stroke="#B4ABFF" strokeWidth="1.3" strokeLinecap="round" />
        <g transform="translate(16 13) scale(1.08)">
          <circle r="6.1" fill="#B4ABFF" fillOpacity=".07" />
          <g className="ring">
            <WheelRing stroke="#B4ABFF" />
          </g>
          <g className="eye-open">
            <g className="eye">
              <path d={ALMOND} fill="#B4ABFF" />
              <circle r="1.45" fill="#0b0c10" />
              <g clipPath={`url(#${clipId})`}>
                <g
                  className="look"
                  style={{ transform: `translate(${look.x * 0.45}px, ${look.y * 0.45}px)` }}
                >
                  <circle r="0.72" fill="#B4ABFF" />
                </g>
              </g>
            </g>
          </g>
        </g>
        <g className="bag bag-b">
          <rect x="8.6" y="19.4" width="10.4" height="4.2" rx="1.1" fill="#B4ABFF" />
          <path d="M12.4 21.5h3" stroke="#060709" strokeWidth=".9" strokeLinecap="round" />
        </g>
        <g className="bag bag-c">
          <rect x="20.2" y="20.4" width="3.6" height="3.2" rx=".8" fill="#B4ABFF" />
          <path
            d="M21.1 20.4v-.8h1.8v.8"
            fill="none"
            stroke="#B4ABFF"
            strokeWidth=".9"
            strokeLinejoin="round"
          />
        </g>
        <rect x="4.5" y="23.6" width="23" height="2.6" rx="1.3" fill="#B4ABFF" />
        <path d="M8.2 26.2v1M23.8 26.2v1" stroke="#B4ABFF" strokeWidth="1.2" />
        <g className="wheel">
          <circle cx="8.2" cy="28.7" r="2" fill="none" stroke="#B4ABFF" strokeWidth="1.6" />
          <path d="M8.2 27.3v2.8" stroke="#B4ABFF" strokeWidth="1" strokeLinecap="round" />
        </g>
        <g className="wheel">
          <circle cx="23.8" cy="28.7" r="2" fill="none" stroke="#B4ABFF" strokeWidth="1.6" />
          <path d="M23.8 27.3v2.8" stroke="#B4ABFF" strokeWidth="1" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
