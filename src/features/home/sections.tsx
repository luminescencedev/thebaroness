import { Link } from "react-router";
import type { HeroSummary, RankTier } from "@/api";
import { Sparkline, smoothPath } from "@/components/charts";
import { HeroCard } from "@/features/heroes/HeroCard";
import { Reveal } from "@/components/Reveal";
import { RankBadge } from "@/components/media/RankBadge";
import { buttonStyles } from "@/components/ui";
import { SteamButton } from "@/features/auth/SteamButton";

export function SectionTitle({
  id,
  eyebrow,
  title,
  text,
  align = "center",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto mb-10 max-w-2xl text-center" : "mb-10 max-w-2xl"}>
      {eyebrow && (
        <p className="text-xs font-medium tracking-[0.14em] text-accent-text uppercase">
          {eyebrow}
        </p>
      )}
      <h2 id={id} className="mt-3 text-3xl sm:text-4xl">
        {title}
      </h2>
      {text && <p className="mt-3 text-muted">{text}</p>}
    </div>
  );
}

/* ---------- Aperçu d'un profil (illustration, données d'exemple signalées) ---------- */

const KDA = [
  2.4, 3.1, 1.6, 2.9, 3.8, 2.2, 1.9, 3.3, 4.4, 2.6, 1.4, 3.0, 2.83, 1.78, 5.5, 2.25, 3.4, 6.67,
  2.57, 5.0,
];
const PREVIEW_KPIS = [
  { label: "Victoires", value: "57,1 %", spark: [48, 52, 50, 55, 53, 56, 57] },
  { label: "KDA moyen", value: "2,84", spark: [2.4, 2.6, 2.5, 2.7, 2.9, 2.8, 2.84] },
  { label: "Parties", value: "42", spark: [30, 33, 35, 36, 38, 40, 42] },
  { label: "Rang", value: "Oracle 4", spark: [3, 3, 4, 4, 4, 5, 5] },
];

export function ProfilePreview() {
  const big = smoothPath(KDA, 1000, 160, 14, 0, 8);
  return (
    <div
      role="img"
      aria-label="Aperçu d'un profil, données d'exemple"
      className="card rounded-[22px] bg-white/[0.02] p-2.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_40px_120px_-40px_rgb(91_75_240/0.45)]"
    >
      <div className="overflow-hidden rounded-[14px] border border-border bg-[#0a0b0e]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2.5 rounded-full bg-[#262a31]" />
          ))}
          <span className="mono mx-auto hidden text-xs text-subtle sm:block">
            thebaroness.gg / players / corvid
          </span>
          <span className="ml-auto rounded-full border border-border-strong px-2 py-px text-[11px] text-subtle sm:ml-0">
            exemple
          </span>
        </div>
        <div className="flex flex-col gap-4 p-4 text-left sm:p-6">
          <div className="flex items-center gap-3.5">
            <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#2b2550] to-[#14161b] text-lg font-semibold shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
              C
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold">Corvid</span>
              <span className="text-xs text-subtle">Oracle 4 · Europe</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PREVIEW_KPIS.map((k) => (
              <div key={k.label} className="card flex flex-col gap-1.5 rounded-xl px-4 py-3.5">
                <span className="text-xs text-subtle">{k.label}</span>
                <span className="text-2xl font-semibold tracking-[-0.03em]">{k.value}</span>
                <Sparkline values={k.spark} />
              </div>
            ))}
          </div>
          <div className="card flex flex-col gap-2.5 rounded-xl px-[18px] py-4">
            <div className="flex justify-between">
              <span className="font-medium">KDA · 20 dernières parties</span>
              <span className="text-xs text-subtle">plus récente à droite</span>
            </div>
            <svg
              viewBox="0 0 1000 160"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="h-40 w-full"
            >
              <defs>
                <linearGradient id="home-preview" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#5B4BF0" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#5B4BF0" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 40H1000M0 80H1000M0 120H1000" stroke="rgb(255 255 255 / 0.05)" />
              <path d={big.area} fill="url(#home-preview)" />
              <path
                d={big.line}
                fill="none"
                stroke="#B4ABFF"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Fonctions ---------- */

function MiniSearch() {
  return (
    <div className="flex flex-col justify-center gap-2" aria-hidden="true">
      <div className="flex h-[34px] items-center gap-2.5 rounded-lg bg-surface px-3 text-[13px] text-subtle">
        <svg viewBox="0 0 24 24" fill="none" className="size-[13px]">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        corv
      </div>
      <div className="flex h-[34px] items-center gap-2.5 rounded-lg bg-accent/15 px-3 text-[13px]">
        Corvid
        <span className="mono ml-auto text-[11px] text-muted">7656…0000</span>
      </div>
    </div>
  );
}

function MiniHistory() {
  const rows: [string, "win" | "loss", string][] = [
    ["Seven", "win", "11 / 4 / 9"],
    ["Wraith", "loss", "6 / 7 / 12"],
    ["Seven", "win", "14 / 3 / 6"],
    ["Vindicta", "win", "9 / 5 / 8"],
  ];
  return (
    <div className="flex flex-col justify-center gap-2" aria-hidden="true">
      {rows.map(([hero, res, kda], i) => (
        <div key={i} className="flex items-center gap-2.5 text-xs">
          <span className={`size-1.5 rounded-full ${res === "win" ? "bg-win" : "bg-loss"}`} />
          {hero}
          <span className="ml-auto text-muted tabular-nums">{kda}</span>
        </div>
      ))}
    </div>
  );
}

function MiniPrivate() {
  return (
    <div className="flex flex-col justify-center gap-2" aria-hidden="true">
      <div className="flex items-center gap-2 text-[13px] font-medium">
        Partenaire régulier
        <span className="ml-auto rounded-md bg-accent/15 px-[7px] py-px text-[11px] text-accent-text">
          duo
        </span>
      </div>
      <div className="text-xs text-muted">Très bon sur son héros principal</div>
      <div className="flex items-center gap-1.5 text-[11px] text-subtle">
        <svg viewBox="0 0 24 24" fill="none" className="size-3">
          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8 11V7a4 4 0 0 1 8 0v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Visible par vous seul
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: "Recherche instantanée",
    text: "Pseudo ou SteamID64, au clavier de bout en bout. ⌘K depuis n'importe quelle page.",
    art: <MiniSearch />,
  },
  {
    title: "Historique honnête",
    text: "Les parties disponibles, datées. Quand une donnée manque, on le montre au lieu d'inventer.",
    art: <MiniHistory />,
  },
  {
    title: "Liste privée",
    text: "Alias, note et tags pour chaque joueur suivi. Personne d'autre n'y a accès.",
    art: <MiniPrivate />,
  },
];

export function Features() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {FEATURES.map((f, i) => (
        <Reveal key={f.title} delay={i * 70}>
          <article className="card flex h-full flex-col gap-4 p-6">
            <div className="card flex h-[132px] flex-col justify-center rounded-xl p-3.5">
              {f.art}
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base">{f.title}</h3>
              <p className="text-muted">{f.text}</p>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

/* ---------- Catalogue (visuels réels) ---------- */

export function RankLadder({ ranks }: { ranks: RankTier[] }) {
  return (
    <ol className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {ranks.map((r, i) => (
        <li key={r.tier}>
          <Reveal delay={(i % 6) * 50}>
            <div
              className="card flex flex-col items-center gap-2 px-2 py-5 text-center"
              style={{
                boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.04), inset 0 -24px 40px -28px ${r.color}55`,
              }}
            >
              <RankBadge name={r.name} imageUrl={r.imageUrl} color={r.color} size="lg" />
              <span className="text-sm font-medium">{r.name}</span>
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

export function HeroShowcase({ heroes }: { heroes: HeroSummary[] }) {
  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {heroes.slice(0, 10).map((h, i) => (
          <li key={h.id}>
            <Reveal delay={(i % 5) * 50}>
              <HeroCard hero={h} />
            </Reveal>
          </li>
        ))}
      </ul>
      <div className="mt-8 text-center">
        <Link to="/heroes" className={buttonStyles("secondary")}>
          Voir les {heroes.length} héros
        </Link>
      </div>
    </div>
  );
}

/* ---------- Appel à l'action ---------- */

export function SteamCta() {
  return (
    <Reveal>
      <div className="card relative isolate flex flex-wrap items-center justify-between gap-6 overflow-hidden p-8 sm:p-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(50%_120%_at_100%_0%,rgb(91_75_240/0.25),transparent_70%)]"
        />
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl">Commencez à suivre vos joueurs.</h2>
          <p className="text-muted">Gratuit. Connexion avec Steam, sans mot de passe à créer.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link to="/search" className={buttonStyles("secondary")}>
            Explorer sans compte
          </Link>
          <SteamButton returnTo="/tracked" />
        </div>
      </div>
    </Reveal>
  );
}
