type BrandMarkProps = { size?: number; className?: string; variant?: "primary" | "monochrome" | "muted" | "dark" };
/** Marque accessible par décor ; conserver un nom lisible au conteneur si la marque est le seul contenu. */
export function BrandMark({ size = 36, className, variant = "primary" }: BrandMarkProps) {
  return <img src={`/brand/logos/svg/mark-${variant}.svg`} alt="" aria-hidden="true" width={size} height={size} className={className} />;
}
