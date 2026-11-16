import { Link } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { Reveal } from "@/components/Reveal";
import { MOCK_ENABLED } from "@/config";
import { useHeroes, useMap, useRanks } from "@/features/heroes/hooks";
import {
  Features,
  HeroShowcase,
  ProfilePreview,
  RankLadder,
  SectionTitle,
  SteamCta,
} from "@/features/home/sections";
import { SearchForm } from "@/features/players/SearchForm";

const pill =
  "pressable hover-text inline-flex h-[30px] items-center gap-1.5 rounded-full bg-surface px-3 text-[13px] text-muted shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]";

export function HomePage() {
  useDocumentTitle("Accueil");
  const heroes = useHeroes();
  const ranks = useRanks();
  const map = useMap();

  return (
    <div className="-mt-10 space-y-24 sm:space-y-32">
      <section className="relative isolate -mx-4 sm:-mx-6">
        <div aria-hidden="true" className="hero-glow absolute inset-0 -z-10" />
        <div aria-hidden="true" className="hero-grid absolute inset-0 -z-10" />
        {map.data && (
          <img
            src={map.data.minimap}
            alt=""
            aria-hidden="true"
            className="absolute top-12 left-1/2 -z-10 w-[min(130%,1100px)] -translate-x-1/2 opacity-[0.08] mix-blend-screen [mask-image:radial-gradient(closest-side,#000,transparent)]"
          />
        )}

        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-4 pt-28 pb-16 text-center sm:px-6 sm:pt-36">
          <Reveal>
            <p className={pill}>
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-win shadow-[0_0_0_3px_rgb(61_214_140/0.18)]"
              />
              Données Deadlock API, rafraîchies toutes les 3 min
            </p>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="grad max-w-[900px] text-5xl leading-[1.02] sm:text-7xl lg:text-[80px]">
              Vos stats Deadlock,
              <br />
              lues en une seconde.
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="max-w-[560px] text-base leading-relaxed text-muted sm:text-lg">
              Rang, héros, parties récentes et tendances de n&apos;importe quel joueur. Gardez ceux
              qui comptent dans une liste privée.
            </p>
          </Reveal>
          <Reveal delay={180} className="mt-2 flex w-full max-w-[620px] flex-col gap-3.5">
            <SearchForm variant="hero" />
            {MOCK_ENABLED && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-subtle">Essayer</span>
                <Link to="/players/76561198000000000" className={pill}>
                  Corvid
                </Link>
                <Link to="/players/76561198000000000" className={`${pill} mono`}>
                  76561198000000000
                </Link>
              </div>
            )}
          </Reveal>
        </div>

        <div className="mx-auto max-w-[1120px] px-4 pb-4 sm:px-6">
          <Reveal delay={240}>
            <ProfilePreview />
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="fonctions" className="mx-auto max-w-[1120px]">
        <SectionTitle
          id="fonctions"
          align="left"
          title="Tout ce qu'il faut, rien de plus."
          text="Une recherche, une fiche claire, une liste de suivis. Chaque chiffre dit d'où il vient et quand il a été collecté."
        />
        <Features />
      </section>

      {ranks.data && (
        <section aria-labelledby="rangs" className="mx-auto max-w-[1120px]">
          <SectionTitle
            id="rangs"
            eyebrow="Rangs"
            title="De l'Obscurus à l'Eternus"
            text="Chaque rang compte six sous-rangs, affichés comme dans le jeu."
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

      <section aria-label="Connexion" className="mx-auto max-w-[1120px]">
        <SteamCta />
      </section>
    </div>
  );
}
