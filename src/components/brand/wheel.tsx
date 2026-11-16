/**
 * Médaillon : roue à huit rayons et œil central en amande (iris cerclé, pupille),
 * dessiné à la main d'après la silhouette de l'emblème du jeu. Centré en (0, 0), rayon 5,3.
 */
export const ALMOND = "M-4.5 0C-2.8 -2.7 2.8 -2.7 4.5 0C2.8 2.7 -2.8 2.7 -4.5 0Z";

const SPOKES = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  const f = (n: number) => n.toFixed(2);
  return {
    key: i,
    d: `M${f(Math.cos(a) * 1.5)} ${f(Math.sin(a) * 1.5)}L${f(Math.cos(a) * 4.75)} ${f(Math.sin(a) * 4.75)}`,
  };
});

/** Anneau extérieur et huit rayons (tourne au chargement). */
export function WheelRing({ stroke }: { stroke: string }) {
  return (
    <>
      <circle r="5.3" fill="none" stroke={stroke} strokeWidth="1.05" />
      {SPOKES.map((s) => (
        <path key={s.key} d={s.d} stroke={stroke} strokeWidth="0.95" strokeLinecap="round" />
      ))}
    </>
  );
}

/** Amande de l'œil, iris (fond) et pupille. `pupil` peut être décalée (suivi du pointeur). */
export function WheelEye({
  ink,
  iris,
  pupilOffset = { x: 0, y: 0 },
}: {
  ink: string;
  /** Couleur du fond de l'iris (le noir du site ou le violet en version blanche). */
  iris: string;
  pupilOffset?: { x: number; y: number };
}) {
  return (
    <>
      <path d={ALMOND} fill={ink} />
      <circle r="1.45" fill={iris} />
      <circle r="0.72" fill={ink} transform={`translate(${pupilOffset.x} ${pupilOffset.y})`} />
    </>
  );
}
