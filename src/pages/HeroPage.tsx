import { Tabs } from "@base-ui/react/tabs";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { isApiError, type HeroDetail } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { BrandLoader } from "@/components/brand";
import { ErrorState } from "@/components/ErrorState";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { Button, EmptyState, buttonStyles } from "@/components/ui";
import { AbilitiesPanel } from "@/features/heroes/detail/AbilitiesPanel";
import { BuildsPanel } from "@/features/heroes/detail/BuildsPanel";
import { MetaKpis, TierChart } from "@/features/heroes/detail/MetaPanel";
import { PairsPanel } from "@/features/heroes/detail/PairsPanel";
import { useHero } from "@/features/heroes/hooks";
import { ROLE_LABELS, complexityLabel } from "@/features/heroes/roles";
import { formatDecimal } from "@/lib/format";

const TABS = [
  { value: "overview", label: "Aperçu" },
  { value: "abilities", label: "Capacités" },
  { value: "builds", label: "Builds" },
  { value: "stats", label: "Statistiques" },
] as const;
type TabValue = (typeof TABS)[number]["value"];

/** Première phrase du lore : une introduction courte pour l'en-tête. */
function intro(lore: string): string {
  const first = lore.match(/^.*?[.!?](\s|$)/)?.[0]?.trim() ?? lore;
  return first.length > 200 ? `${first.slice(0, 200).trimEnd()}…` : first;
}

function Header({ hero }: { hero: HeroDetail }) {
  return (
    <header className="card-hero relative">
      <img
        src={hero.images.background}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 size-full object-cover object-top opacity-40"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/90 via-bg/60 to-bg/10"
      />
      <div className="flex items-end gap-4 p-4 sm:gap-6 sm:p-7">
        <HeroPortrait
          name={hero.name}
          src={hero.images.card}
          color={hero.color}
          className="aspect-[4/5] w-24 shrink-0 border-2 sm:w-36"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5 text-xs font-medium">
            <span
              className="rounded-full border px-2.5 py-1"
              style={{
                background: "rgb(9 10 12 / 0.6)",
                borderColor: `color-mix(in srgb, ${hero.color} 55%, transparent)`,
                color: `color-mix(in srgb, ${hero.color} 40%, white)`,
              }}
            >
              {ROLE_LABELS[hero.role]}
            </span>
            {hero.gunTag && (
              <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-text">
                {hero.gunTag}
              </span>
            )}
            <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-text">
              Complexité : {complexityLabel(hero.complexity)}
            </span>
          </div>
          <h1
            className="mt-2 text-4xl sm:text-5xl"
            style={{ textShadow: `0 0 40px color-mix(in srgb, ${hero.color} 40%, transparent)` }}
          >
            {hero.name}
          </h1>
          {hero.tags.length > 0 && (
            <p className="mt-1.5 text-sm text-muted">{hero.tags.join(" · ")}</p>
          )}
          {hero.lore && (
            <p className="mt-2 hidden max-w-2xl text-sm leading-relaxed text-text/80 sm:block">
              {intro(hero.lore)}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

function Lore({ lore }: { lore: string }) {
  const [open, setOpen] = useState(false);
  const short = lore.length > 360 && !open ? `${lore.slice(0, 360).trimEnd()}…` : lore;
  return (
    <section aria-labelledby="lore" className="max-w-3xl">
      <h2 id="lore" className="text-xl">
        Histoire
      </h2>
      <p className="mt-3 leading-relaxed text-muted">{short}</p>
      {lore.length > 360 && (
        <Button variant="ghost" size="sm" className="mt-2 -ml-3" onClick={() => setOpen((v) => !v)}>
          {open ? "Réduire" : "Lire la suite"}
        </Button>
      )}
    </section>
  );
}

export function HeroPage() {
  const { heroId = "" } = useParams();
  const query = useHero(heroId);
  const [params, setParams] = useSearchParams();
  useDocumentTitle(query.data?.hero.name ?? "Héros");

  if (query.isPending) return <BrandLoader message="Le Doorman range le catalogue" />;
  if (query.isError) {
    if (isApiError(query.error) && (query.error.status === 404 || query.error.status === 400)) {
      return (
        <EmptyState
          icon="search"
          title="Héros introuvable"
          description="Ce héros n'existe pas dans le catalogue."
          action={
            <Link to="/heroes" className={buttonStyles("secondary")}>
              Tous les héros
            </Link>
          }
        />
      );
    }
    return (
      <ErrorState
        error={query.error}
        title="Héros indisponible"
        onRetry={() => void query.refetch()}
      />
    );
  }

  const { hero } = query.data;
  const tab = (TABS.find((t) => t.value === params.get("tab"))?.value ?? "overview") as TabValue;
  // Changer d'onglet réinitialise les paramètres propres à l'onglet quitté (tri, build) mais garde la période.
  const setTab = (value: string) =>
    setParams(
      (cur) => {
        const next = new URLSearchParams();
        for (const k of ["period", "mode"]) if (cur.get(k)) next.set(k, cur.get(k) as string);
        if (value !== "overview") next.set("tab", value);
        return next;
      },
      { replace: false },
    );

  return (
    <div className="max-w-[1280px] space-y-6" style={{ ["--hc" as string]: hero.color }}>
      <Header hero={hero} />

      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List
          aria-label="Sections du héros"
          className="relative inline-flex max-w-full overflow-x-auto rounded-[13px] bg-surface p-[3px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]"
        >
          <Tabs.Indicator className="absolute top-[var(--active-tab-top)] left-0 h-[var(--active-tab-height)] w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-[10px] bg-white/[0.1] shadow-[0_1px_2px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.07)] transition-[translate,width] duration-[220ms] ease-[var(--ease-in-out)] motion-reduce:transition-none" />
          {TABS.map((t) => (
            <Tabs.Tab
              key={t.value}
              value={t.value}
              className="pressable relative z-10 h-9 shrink-0 rounded-[10px] px-4 text-[13px] font-medium text-subtle outline-none hover:text-muted focus-visible:outline-2 focus-visible:outline-focus data-[selected]:text-text"
            >
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <div className="pt-6">
          <Tabs.Panel value="overview" className="space-y-8 outline-none">
            <section aria-labelledby="meta" className="space-y-3">
              <h2 id="meta" className="text-xl">
                Méta
              </h2>
              <MetaKpis hero={hero} />
            </section>
            {hero.stats.length > 0 && (
              <section aria-labelledby="base" className="space-y-3">
                <h2 id="base" className="text-xl">
                  Statistiques de base
                </h2>
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {hero.stats.map((s) => (
                    <div key={s.key} className="rounded-2xl border border-border bg-surface p-4">
                      <dt className="text-xs text-muted">{s.label}</dt>
                      <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                        {formatDecimal(s.value).replace(/,00$/, "")}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            {hero.lore && <Lore lore={hero.lore} />}
          </Tabs.Panel>

          <Tabs.Panel value="abilities" className="space-y-3 outline-none">
            <h2 className="text-xl">Capacités</h2>
            <AbilitiesPanel abilities={hero.abilities} color={hero.color} />
          </Tabs.Panel>

          <Tabs.Panel value="builds" className="space-y-3 outline-none">
            <h2 className="text-xl">Builds communautaires</h2>
            <BuildsPanel heroId={hero.id} color={hero.color} />
          </Tabs.Panel>

          <Tabs.Panel value="stats" className="space-y-8 outline-none">
            <section aria-labelledby="tiers" className="space-y-3">
              <h2 id="tiers" className="sr-only">
                Taux de victoire par rang
              </h2>
              <TierChart hero={hero} />
            </section>
            <PairsPanel heroId={hero.id} color={hero.color} />
          </Tabs.Panel>
        </div>
      </Tabs.Root>
    </div>
  );
}
