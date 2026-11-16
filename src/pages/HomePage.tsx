import { useMemo } from "react";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { Reveal } from "@/components/Reveal";
import { useHeroes, useMap, useRanks } from "@/features/heroes/hooks";
import {
  Features,
  HeroShowcase,
  HeroStrip,
  RankLadder,
  SectionTitle,
  SteamCta,
} from "@/features/home/sections";
import { SearchForm } from "@/features/players/SearchForm";

/** Sélection stable de héros pour la rangée d'en-tête (pas d'aléatoire : même rendu à chaque visite). */
const STRIP_COUNT = 9;

export function HomePage() {
  useDocumentTitle("Accueil");
  const heroes = useHeroes();
  const ranks = useRanks();
  const map = useMap();

  const strip = useMemo(() => {
    const items = heroes.data?.items;
    if (!items) return undefined;
    const step = Math.max(1, Math.floor(items.length / STRIP_COUNT));
    return Array.from({ length: STRIP_COUNT }, (_, i) => items[(i * step) % items.length]).filter(
      (h): h is NonNullable<typeof h> => Boolean(h),
    );
  }, [heroes.data]);

  return (
    <div className="-mt-10 space-y-28 sm:space-y-36">
      <section className="relative isolate -mx-4 overflow-hidden px-4 pt-24 pb-4 sm:-mx-6 sm:px-6 sm:pt-32">
        <div aria-hidden="true" className="hero-glow absolute inset-0 -z-10" />
        <div aria-hidden="true" className="dot-grid absolute inset-0 -z-10" />
        {map.data && (
          <img
            src={map.data.minimap}
            alt=""
            aria-hidden="true"
            className="absolute top-8 left-1/2 -z-10 w-[min(130%,1100px)] -translate-x-1/2 opacity-[0.1] mix-blend-screen [mask-image:radial-gradient(closest-side,#000,transparent)]"
          />
        )}

        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-3.5 py-1.5 text-xs text-muted">
              <span className="size-1.5 rounded-full bg-win" aria-hidden="true" />
              Statistiques Deadlock, sans compte pour chercher
            </p>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="mt-6 text-5xl leading-[1.02] sm:text-7xl">
              Lisez chaque partie
              <br />
              <span className="text-accent-text">comme un pro.</span>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted sm:text-lg">
              Recherchez un joueur, suivez sa progression, comparez ses héros et gardez vos
              coéquipiers à portée de clic.
            </p>
          </Reveal>
          <Reveal delay={180} className="mt-9 w-full max-w-xl">
            <SearchForm large />
            <p className="mt-3 text-xs text-subtle">Pseudo ou identifiant Steam (SteamID64).</p>
          </Reveal>
        </div>

        {!heroes.isError && (
          <div className="mt-16 sm:mt-20">
            <HeroStrip heroes={strip} />
          </div>
        )}
      </section>

      {heroes.data && ranks.data && (
        <section aria-labelledby="fonctions" className="mx-auto max-w-5xl">
          <SectionTitle
            id="fonctions"
            eyebrow="Fonctions"
            title="Tout pour comprendre un joueur"
            text="Une seule recherche, puis le profil, les parties, les héros et la progression."
          />
          <Features heroes={heroes.data.items} ranks={ranks.data.items} />
        </section>
      )}

      {ranks.data && (
        <section aria-labelledby="rangs" className="mx-auto max-w-5xl">
          <SectionTitle
            id="rangs"
            eyebrow="Rangs"
            title="Douze rangs, de l'Obscurus à l'Éternus"
            text="Chaque rang a six sous-rangs : on les affiche tels que le jeu les présente."
          />
          <RankLadder ranks={ranks.data.items} />
        </section>
      )}

      {heroes.data && (
        <section aria-labelledby="heros" className="mx-auto max-w-6xl">
          <SectionTitle
            id="heros"
            eyebrow="Héros"
            title="Chaque héros, ses capacités et sa méta"
            text="Portraits, rôles et statistiques issus du catalogue du jeu."
          />
          <HeroShowcase heroes={heroes.data.items} />
        </section>
      )}

      <section aria-label="Connexion" className="mx-auto max-w-5xl pb-4">
        <SteamCta mapUrl={map.data?.minimap} />
      </section>
    </div>
  );
}
