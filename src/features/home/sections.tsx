import { Link } from "react-router";
import type { HeroSummary, RankTier } from "@/api";
import { Reveal } from "@/components/Reveal";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { RankBadge } from "@/components/media/RankBadge";
import { Card, Skeleton, Tag, buttonStyles } from "@/components/ui";
import { SteamButton } from "@/features/auth/SteamButton";
import { HeroCard } from "@/features/heroes/HeroCard";

export function SectionTitle({
  id,
  eyebrow,
  title,
  text,
}: {
  id: string;
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="text-xs font-medium tracking-[0.14em] text-accent-text uppercase">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-3xl sm:text-4xl">
        {title}
      </h2>
      {text && <p className="mt-3 text-muted">{text}</p>}
    </div>
  );
}

/** Rangée de portraits verticaux du catalogue, sous la recherche. */
export function HeroStrip({ heroes }: { heroes: HeroSummary[] | undefined }) {
  if (!heroes) {
    return (
      <div className="flex justify-center gap-2" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-40 w-16 rounded-xl sm:h-52 sm:w-24" />
        ))}
      </div>
    );
  }
  return (
    <ul
      className="flex justify-start gap-2 overflow-x-auto px-1 pb-4 sm:justify-center sm:overflow-visible"
      aria-label="Quelques héros"
    >
      {heroes.map((h, i) => (
        <li key={h.id} className="shrink-0" style={{ marginTop: i % 2 === 0 ? 0 : 14 }}>
          <Reveal delay={120 + i * 45}>
            <Link
              to={`/heroes/${h.id}`}
              aria-label={h.name}
              className="pressable relative block overflow-hidden rounded-xl border border-border-strong"
            >
              <HeroPortrait
                name={h.name}
                src={h.images.vertical}
                color={h.color}
                className="h-40 w-16 rounded-none sm:h-52 sm:w-24"
              />
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1 opacity-80"
                style={{ backgroundColor: h.color }}
              />
            </Link>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

/** Illustration décorative : aucune statistique réelle ni inventée. */
function MiniChart() {
  return (
    <svg viewBox="0 0 240 80" aria-hidden="true" className="h-20 w-full">
      <defs>
        <linearGradient id="mini-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3dd68c" stopOpacity="0.3" />
          <stop offset="1" stopColor="#3dd68c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 60 L30 52 L60 56 L90 38 L120 42 L150 24 L180 30 L210 14 L240 18 L240 80 L0 80Z"
        fill="url(#mini-area)"
      />
      <path
        d="M0 60 L30 52 L60 56 L90 38 L120 42 L150 24 L180 30 L210 14 L240 18"
        fill="none"
        stroke="#3dd68c"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Features({ heroes, ranks }: { heroes: HeroSummary[]; ranks: RankTier[] }) {
  const sample = ranks.filter((r) => [5, 8, 11].includes(r.tier));
  return (
    <div className="grid gap-3 md:grid-cols-6">
      <Reveal className="md:col-span-3">
        <Card className="h-full">
          <h3 className="text-lg">Profil joueur</h3>
          <p className="mt-2 text-sm text-muted">
            Rang, victoires, défaites et KDA réunis dans une fiche lisible, avec la date de collecte
            des données.
          </p>
          <div className="mt-6 flex items-center gap-4" aria-hidden="true">
            {sample.map((r) => (
              <RankBadge key={r.tier} name={r.name} imageUrl={r.imageUrl} size="lg" />
            ))}
          </div>
        </Card>
      </Reveal>
      <Reveal delay={80} className="md:col-span-3">
        <Card className="h-full">
          <h3 className="text-lg">Progression</h3>
          <p className="mt-2 text-sm text-muted">
            Courbes de taux de victoire et de KDA, partie après partie, avec la méthode de calcul
            affichée.
          </p>
          <div className="mt-6">
            <MiniChart />
          </div>
        </Card>
      </Reveal>
      <Reveal delay={40} className="md:col-span-2">
        <Card className="h-full">
          <h3 className="text-lg">Héros</h3>
          <p className="mt-2 text-sm text-muted">
            Capacités, statistiques de base et méta de chaque héros.
          </p>
          <ul className="mt-6 flex -space-x-3" aria-hidden="true">
            {heroes.slice(0, 5).map((h) => (
              <li key={h.id}>
                <HeroPortrait
                  name={h.name}
                  src={h.images.small}
                  rounded="full"
                  className="size-11 border-2 border-bg"
                />
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>
      <Reveal delay={120} className="md:col-span-2">
        <Card className="h-full">
          <h3 className="text-lg">Classement</h3>
          <p className="mt-2 text-sm text-muted">Les meilleurs joueurs de chaque région.</p>
          <ol className="mt-6 space-y-1.5 text-sm text-subtle" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex items-center gap-3">
                <span className="w-4 text-right tabular-nums">{n}</span>
                <span
                  className="h-2 flex-1 rounded-full bg-surface-strong"
                  style={{ maxWidth: `${100 - n * 14}%` }}
                />
              </li>
            ))}
          </ol>
        </Card>
      </Reveal>
      <Reveal delay={200} className="md:col-span-2">
        <Card className="h-full">
          <h3 className="text-lg">Suivis privés</h3>
          <p className="mt-2 text-sm text-muted">
            Alias, note et tags sur les joueurs que vous suivez. Personne d'autre ne les voit.
          </p>
          <div className="mt-6 flex flex-wrap gap-1.5" aria-hidden="true">
            <Tag>duo</Tag>
            <Tag>ranked</Tag>
            <Tag>à revoir</Tag>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

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

export function SteamCta({ mapUrl }: { mapUrl: string | undefined }) {
  return (
    <Reveal>
      <div className="card relative isolate overflow-hidden px-6 py-14 text-center sm:px-12">
        {mapUrl && (
          <img
            src={mapUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute top-1/2 left-1/2 -z-10 w-[min(120%,900px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.16] mix-blend-screen [mask-image:radial-gradient(closest-side,#000,transparent)]"
          />
        )}
        <h2 className="mx-auto max-w-xl text-3xl sm:text-4xl">Gardez vos joueurs à l'œil</h2>
        <p className="mx-auto mt-4 max-w-lg text-muted">
          Connectez-vous avec Steam pour suivre des joueurs, ajouter un alias, une note et des tags.
          Nous ne gardons que votre identifiant public, votre pseudo et votre avatar.
        </p>
        <div className="mt-8 flex justify-center">
          <SteamButton returnTo="/tracked" className="h-12 rounded-full px-6" />
        </div>
      </div>
    </Reveal>
  );
}
