/**
 * Médaillon : roue à huit rayons et œil central, dans l'esprit de l'emblème du jeu.
 * Dessin vectoriel refait à la main (jamais calqué sur l'image officielle).
 * Repère : centré en (0, 0), rayon extérieur 5,3.
 */
const SPOKES = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  return {
    key: i,
    x1: (Math.cos(a) * 2.2).toFixed(2),
    y1: (Math.sin(a) * 2.2).toFixed(2),
    x2: (Math.cos(a) * 4.9).toFixed(2),
    y2: (Math.sin(a) * 4.9).toFixed(2),
  };
});

export function WheelRing({ stroke }: { stroke: string }) {
  return (
    <>
      <circle r="5.3" fill="none" stroke={stroke} strokeWidth="1.15" />
      {SPOKES.map((s) => (
        <path
          key={s.key}
          d={`M${s.x1} ${s.y1}L${s.x2} ${s.y2}`}
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

export function WheelEye({
  stroke,
  iris,
  pupil,
  eyeBg,
}: {
  stroke: string;
  iris: string;
  pupil: string;
  eyeBg: string;
}) {
  return (
    <>
      <circle r="2.2" fill={eyeBg} stroke={stroke} strokeWidth="0.9" />
      <circle r="1.05" fill={iris} />
      <circle r="0.45" fill={pupil} />
    </>
  );
}
