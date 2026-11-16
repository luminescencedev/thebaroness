import type { HeroRole } from "@/api";

const ROLE_FALLBACK: Record<HeroRole, string> = {
  mystic: "#8B7CFF",
  marksman: "#6FB7FF",
  brawler: "#F5B14C",
  assassin: "#FF6B9A",
  healer: "#3DD68C",
};

function toHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function toHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  const f = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`.toUpperCase();
}

/**
 * Couleur d'affichage d'un héros : on garde sa teinte, mais on la rend vive et lisible sur fond noir
 * (saturation et luminosité minimales). Les héros presque gris prennent la couleur de leur rôle.
 */
export function vividColor(hex: string, role?: HeroRole): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return role ? ROLE_FALLBACK[role] : "#8B7CFF";
  const [h, s, l] = toHsl(hex);
  if (s < 0.22) return role ? ROLE_FALLBACK[role] : "#8B7CFF";
  return toHex(h, Math.max(0.62, Math.min(0.9, s)), Math.max(0.56, Math.min(0.68, l)));
}
