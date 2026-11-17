import { Link } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { Reveal } from "@/components/Reveal";
import { Emblem } from "@/components/brand/Emblem";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { DoubleBezel } from "@/components/ui";
import { useHeroes } from "@/features/heroes/hooks";
import { HeroSearch } from "@/features/home/HeroSearch";
import { LeaderboardWidget, MetaWidget, PlayersWidget } from "@/features/home/widgets";

/** Héros flottants du décor : position, taille et rythme propres, pure décoration. */
const FLOATERS = [
  {
    name: "Haze",
    pos: "top-6 left-[3%] xl:left-[8%]",
    size: 104,
    rot: "-6deg",
    dur: "6.5s",
    delay: "0s",
  },
  {
    name: "Wraith",
    pos: "top-[240px] left-[-1%] xl:left-[3%]",
    size: 84,
    rot: "5deg",
    dur: "7.5s",
    delay: "-2s",
  },
  {
    name: "Infernus",
    pos: "top-[390px] left-[2%] xl:left-[5%]",
    size: 64,
    rot: "-4deg",
    dur: "5.5s",
    delay: "-1s",
  },
  {
    name: "Seven",
    pos: "top-8 right-[4%] xl:right-[9%]",
    size: 96,
    rot: "6deg",
    dur: "7s",
    delay: "-3s",
  },
  {
    name: "Vindicta",
    pos: "top-[230px] right-[-1%] xl:right-[3%]",
    size: 88,
    rot: "-5deg",
    dur: "6s",
    delay: "-1.5s",
  },
  {
    name: "Lady Geist",
    pos: "top-[400px] right-[2%] xl:right-[5%]",
    size: 66,
    rot: "4deg",
    dur: "8s",
    delay: "-4s",
  },
] as const;

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const textLink =
  "pressable mt-5 inline-flex items-center gap-2 rounded-md text-[12px] font-semibold text-[#ddd8ff] hover:text-white";

export function HomePage() {
  useDocumentTitle("Accueil");
  const heroes = useHeroes();
  const pick = (names: string[], fallback: number) =>
    heroes.data?.items.find((h) => names.includes(h.name)) ?? heroes.data?.items[fallback];
  const floaters = FLOATERS.flatMap((fl, i) => {
    const hero = pick([fl.name], i);
    return hero ? [{ ...fl, hero }] : [];
  });

  return (
    <>
      <section aria-labelledby="titre" className="landing-frame relative isolate pt-8 sm:pt-8">
        {floaters.map((fl) => (
          <div
            key={fl.hero.id}
            aria-hidden="true"
            className={`float-hero hidden md:block ${fl.pos}`}
            style={
              {
                "--hc": fl.hero.color,
                "--rot": fl.rot,
                "--dur": fl.dur,
                "--delay": fl.delay,
                width: fl.size,
                height: fl.size,
              } as React.CSSProperties
            }
          >
            <img src={fl.hero.images.small} alt="" decoding="async" />
          </div>
        ))}

        <div className="relative z-10 mx-auto max-w-[1000px] text-center">
          <Reveal>
            <p className="text-[10px] font-bold tracking-[0.16em] text-[#b0b0bd] uppercase">
              Deadlock tracker · projet communautaire
            </p>
          </Reveal>
          <Reveal delay={50}>
            <h1 id="titre" className="bodoni-title">
              <span className="bodoni-top">
                <Emblem aria-hidden="true" size={72} className="bodoni-emblem" />
                <span className="bodoni-the">The</span>
              </span>{" "}
              <span className="bodoni-name">Baroness</span>
            </h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="mx-auto mb-5 max-w-[535px] text-[13px] leading-[1.7] text-[#a8aab8] sm:mb-6 sm:text-[15px]">
              Retrouvez vos joueurs, explorez les héros et suivez les performances de Deadlock. Tout
              commence par un pseudo.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <HeroSearch />
            <p className="mt-[18px] flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-subtle">
              Ou explorer directement
              <Link
                to="/heroes"
                className="pressable rounded-full border border-border bg-surface px-2.5 py-1.5 text-[#bfc1cb] hover:bg-surface-strong hover:text-white"
              >
                Les héros ↗
              </Link>
              <Link
                to="/leaderboard"
                className="pressable rounded-full border border-border bg-surface px-2.5 py-1.5 text-[#bfc1cb] hover:bg-surface-strong hover:text-white"
              >
                Le classement ↗
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section
        aria-labelledby="decouvrir"
        className="landing-frame relative z-[3] mt-8 pb-24 sm:mt-10"
      >
        <h2 id="decouvrir" className="sr-only">
          Au cœur de Deadlock
        </h2>

        <Reveal className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1.1fr_1fr] lg:items-end lg:gap-[18px]">
          <PlayersWidget className="lg:mb-2 lg:min-h-[380px]" />
          <MetaWidget className="md:max-lg:order-first md:max-lg:col-span-2 lg:mb-5 lg:min-h-[440px]" />
          <LeaderboardWidget className="lg:min-h-[380px]" />
        </Reveal>

        <div id="groupes" className="mt-5 grid gap-4 lg:grid-cols-[1.12fr_0.88fr] lg:gap-[18px]">
          <Reveal>
            <DoubleBezel
              as="article"
              size="lg"
              tone="accent"
              className="h-full min-h-[245px]"
              innerClassName="p-6 sm:p-7"
            >
              <p className="text-[10px] font-bold tracking-[0.12em] text-subtle uppercase">
                Vos joueurs, vos groupes
              </p>
              <h3 className="mt-3 mb-2.5 max-w-[390px] text-[24px] leading-[1.14] font-semibold tracking-[-0.055em] text-balance sm:text-[26px]">
                Les rivalités sont meilleures entre amis.
              </h3>
              <p className="max-w-[390px] text-[12.5px] leading-[1.7] text-[#a2a4b0]">
                Suivez votre équipe, confrontez rang, KDA et forme récente, et voyez qui grimpe le
                plus vite. Connexion Steam requise pour créer un groupe.
              </p>
              <Link to="/groups" className={textLink}>
                Découvrir les groupes <Arrow />
              </Link>
              <svg
                viewBox="0 0 290 200"
                aria-hidden="true"
                className="pointer-events-none absolute right-3 bottom-0 hidden h-[72%] w-[44%] opacity-80 sm:block"
              >
                <defs>
                  <linearGradient id="grp-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="oklch(0.78 0.13 285)" stopOpacity=".2" />
                    <stop offset="1" stopColor="oklch(0.78 0.13 285)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 175C30 182 50 142 75 153S125 102 146 110 184 83 203 70 243 62 290 20V200H0Z"
                  fill="url(#grp-fill)"
                />
                <path
                  d="M0 175C30 182 50 142 75 153S125 102 146 110 184 83 203 70 243 62 290 20"
                  stroke="oklch(0.78 0.13 285)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              <p className="mt-6 text-[10.5px] text-subtle">Illustration, sans donnée réelle</p>
            </DoubleBezel>
          </Reveal>
          <Reveal delay={60}>
            <DoubleBezel
              as="article"
              size="lg"
              className="h-full min-h-[245px]"
              innerClassName="p-6 sm:p-7"
            >
              <p className="text-[10px] font-bold tracking-[0.12em] text-subtle uppercase">
                Explorez librement
              </p>
              <h3 className="mt-3 mb-2.5 max-w-[390px] text-[24px] leading-[1.14] font-semibold tracking-[-0.055em] text-balance sm:text-[26px]">
                Héros. Parties. Statistiques.
              </h3>
              <p className="max-w-[390px] text-[12.5px] leading-[1.7] text-[#a2a4b0]">
                Chaque chiffre dit d&apos;où il vient et quand il a été collecté. Quand une donnée
                manque, on l&apos;indique au lieu de l&apos;inventer.
              </p>
              <Link to="/search" className={textLink}>
                Entrer dans le tracker <Arrow />
              </Link>
              {heroes.data && (
                <ul aria-label="Quelques héros" className="mt-6 flex flex-wrap gap-1.5">
                  {heroes.data.items.slice(0, 8).map((h) => (
                    <li key={h.id}>
                      <Link
                        to={`/heroes/${h.id}`}
                        title={h.name}
                        aria-label={h.name}
                        className="pressable block rounded-[10px]"
                      >
                        <HeroPortrait
                          name={h.name}
                          src={h.images.small}
                          color={h.color}
                          rounded="lg"
                          className="size-10 rounded-[10px]"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </DoubleBezel>
          </Reveal>
        </div>

        <footer className="mx-auto mt-16 max-w-[720px] text-center text-[10.5px] leading-relaxed text-subtle">
          <p>
            Statistiques : Deadlock API, projet communautaire indépendant de Valve. The Baroness
            n&apos;est affilié ni à Valve ni aux organisations du jeu. Deadlock, ses héros, ses
            rangs et leurs visuels appartiennent à Valve Corporation.
          </p>
          <p className="mt-3">
            <a
              href="https://deadlock-api.com"
              target="_blank"
              rel="noreferrer"
              className="hover-text pressable rounded-md"
            >
              Deadlock API
            </a>
          </p>
        </footer>
      </section>
    </>
  );
}
