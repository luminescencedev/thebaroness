// Génère les fixtures de catalogue (héros, rangs, carte) à partir de Deadlock API.
// Usage : node scripts/build-fixtures.mjs
// Données de catalogue réelles (noms, images), en anglais comme dans le jeu. Aucun joueur réel : les joueurs et les
// statistiques des fixtures sont synthétiques (voir src/mocks/synthetic.ts).
import fs from "node:fs";

const API = "https://api.deadlock-api.com/v1/assets";
const out = "src/mocks/fixtures";
const get = async (path) => {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
};

const strip = (html) =>
  String(html ?? "")
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/([.!?])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

const STAT_LABELS = {
  max_health: "Health",
  base_health_regen: "Health regen",
  max_move_speed: "Move speed",
  sprint_speed: "Sprint speed",
  stamina: "Stamina",
  light_melee_damage: "Light melee",
  heavy_melee_damage: "Heavy melee",
  reload_speed: "Reload speed",
};

const [heroes, abilities, ranks, map] = await Promise.all([
  get("/heroes"),
  get("/items/by-type/ability"),
  get("/ranks"),
  get("/map"),
]);

// Les héros récents (Violet, Baba) ont encore `in_development: true` mais sont jouables : on les garde.
const released = heroes.filter(
  (h) => h.player_selectable && !h.disabled && h.development_state === "release",
);

const heroOut = released
  .map((h) => {
    const order = ["signature1", "signature2", "signature3", "signature4"]
      .map((k) => h.items?.[k])
      .filter(Boolean);
    const own = abilities.filter((a) => a.hero === h.id || (a.heroes ?? []).includes(h.id));
    const list = order
      .map((cn) => own.find((a) => a.class_name === cn))
      .filter(Boolean)
      .map((a) => ({
        id: a.id,
        name: a.name,
        imageUrl: a.image_webp ?? a.image ?? null,
        type: a.ability_type === "ultimate" ? "ultimate" : "signature",
        description: strip(a.description?.desc ?? "").slice(0, 260),
        cooldownSeconds: Number(a.properties?.AbilityCooldown?.value) || null,
      }));
    const stats = Object.entries(STAT_LABELS)
      .map(([key, label]) => ({
        key,
        label,
        value: h.starting_stats?.[key]?.value ?? null,
      }))
      .filter((s) => typeof s.value === "number");
    return {
      id: h.id,
      name: h.name,
      role: h.hero_type,
      gunTag: h.gun_tag ?? null,
      complexity: h.complexity ?? null,
      tags: h.tags ?? [],
      color: h.colors?.style_hex ?? "#5B4BF0",
      lore: strip(h.description?.lore ?? ""),
      images: {
        card: h.images.icon_hero_card_webp ?? h.images.icon_hero_card,
        small: h.images.icon_image_small_webp ?? h.images.icon_image_small,
        vertical: h.images.top_bar_vertical_image_webp ?? h.images.top_bar_vertical_image,
        background: h.images.background_image_webp ?? h.images.background_image,
        name: h.images.name_image ?? null,
      },
      stats,
      abilities: list,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "fr"));

const rankOut = ranks.map((r) => ({
  tier: r.tier,
  name: r.name,
  color: r.color,
  imageUrl: r.images.large_webp ?? r.images.large,
  subranks: [1, 2, 3, 4, 5, 6].map((n) => r.images[`large_subrank${n}_webp`] ?? null),
}));

const mapOut = {
  minimap: map.images.mid ?? map.images.minimap,
  tunnels: map.images.mid_tunnels ?? null,
  frame: map.images.frame ?? null,
};

fs.writeFileSync(`${out}/heroes.json`, JSON.stringify(heroOut, null, 1) + "\n");
fs.writeFileSync(`${out}/ranks.json`, JSON.stringify(rankOut, null, 1) + "\n");
fs.writeFileSync(`${out}/map.json`, JSON.stringify(mapOut, null, 1) + "\n");
console.log(`${heroOut.length} héros, ${rankOut.length} rangs`);
console.log(
  heroOut
    .filter((h) => h.abilities.length !== 4)
    .map((h) => `${h.name}:${h.abilities.length}`)
    .join(", ") || "tous les héros ont 4 capacités",
);
