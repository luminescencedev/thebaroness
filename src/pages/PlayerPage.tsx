import { Tabs } from "@base-ui/react/tabs";
import { Link, useParams, useSearchParams } from "react-router";
import { useEffect } from "react";
import { isApiError } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { BrandLoader } from "@/components/brand";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState, buttonStyles } from "@/components/ui";
import { usePlayer } from "@/features/players/hooks";
import { HeroesTab } from "@/features/players/profile/HeroesTab";
import { MatchesTab } from "@/features/players/profile/MatchesTab";
import { OverviewLayout } from "@/features/players/profile/OverviewLayout";
import { ProfileHeader } from "@/features/players/profile/ProfileHeader";
import { ScopeBar } from "@/features/players/profile/ScopeBar";
import { coverageMessages, observedRange, scopeLabel } from "@/features/players/profile/scopeText";
import { useProfileScope } from "@/features/players/scope";
import { useProfileData } from "@/features/players/profile/useProfileData";
import { setNavSubject } from "@/components/layout/navContext";
import { rememberPlayer } from "@/features/search/recents";
import { FollowButton } from "@/features/tracked-players/FollowButton";

const TABS = [
  { value: "overview", label: "Aperçu" },
  { value: "matches", label: "Parties" },
  { value: "heroes", label: "Héros" },
] as const;
type TabValue = (typeof TABS)[number]["value"];

function Body({
  steamId,
  profile,
}: {
  steamId: string;
  profile: NonNullable<ReturnType<typeof usePlayer>["data"]>;
}) {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.value === params.get("tab"))?.value ?? "overview") as TabValue;
  const setTab = (value: string) =>
    setParams(
      (cur) => {
        const next = new URLSearchParams(cur);
        if (value === "overview") next.delete("tab");
        else next.set("tab", value);
        return next;
      },
      { replace: true },
    );

  // Un seul scope (période, format, type) pour l'aperçu, la courbe, les parties et les héros.
  const { scope, filters, setScope, setMatchFilters } = useProfileScope();
  const data = useProfileData(steamId, scope, tab === "heroes" ? 12 : 3);
  const { history, overview } = data;
  const selectedHero = Number(params.get("hero")) || null;
  const heroColor = data.mainHero?.color;
  const { player: p0, rank: r0 } = profile;
  useEffect(() => {
    setNavSubject({
      steamId: p0.steamId,
      name: p0.displayName,
      rankName: r0.name,
      rankImage: r0.imageUrl,
      color: heroColor,
    });
    return () => setNavSubject(null);
  }, [p0.steamId, p0.displayName, r0.name, r0.imageUrl, heroColor]);

  const text = scopeLabel(scope);
  const coverage = overview.data?.coverage;
  const notices = coverage ? coverageMessages(coverage, scope) : [];
  const range = coverage ? observedRange(coverage) : null;
  const scopeQuery = ["period", "gameMode", "matchMode"]
    .filter((k) => params.get(k))
    .map((k) => `&${k}=${encodeURIComponent(params.get(k) as string)}`)
    .join("");
  const heroOptions = data.rows.map((h) => ({ id: h.heroId, name: h.heroName, n: h.matches }));
  const footnote = `Statistiques du back sur ${text}, via Deadlock API, projet communautaire indépendant de Valve.${profile.meta.isPartial ? " Données partielles : l'historique peut être incomplet." : " L'historique peut être incomplet."} KDA = (éliminations + assistances) / max(morts, 1), calculé sur les sommes des parties complètes. Valeur nette par minute = moyenne des ratios par partie.`;

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <ProfileHeader profile={profile} topHeroes={data.rows} heroColor={heroColor} />
      <DataMetaNotice meta={profile.meta} showDate={false} />

      <Tabs.Root value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <Tabs.List
            aria-label="Sections du profil"
            className="relative inline-flex max-w-full rounded-[13px] bg-surface p-[3px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]"
          >
            <Tabs.Indicator className="absolute top-[var(--active-tab-top)] left-0 h-[var(--active-tab-height)] w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-[10px] bg-white/[0.1] shadow-[0_1px_2px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.07)] transition-[translate,width] duration-[220ms] ease-[var(--ease-in-out)] motion-reduce:transition-none" />
            {TABS.map((t) => (
              <Tabs.Tab
                key={t.value}
                value={t.value}
                className="pressable relative z-10 h-9 rounded-[10px] px-4 text-[13px] font-medium text-subtle outline-none hover:text-muted focus-visible:outline-2 focus-visible:outline-focus data-[selected]:text-text"
              >
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <ScopeBar scope={scope} onChange={setScope} />
        </div>

        {(notices.length > 0 || range) && (
          <div className="mt-3 space-y-1 text-[11px] leading-relaxed">
            {range && <p className="text-subtle">{range}.</p>}
            {notices.map((n) => (
              <p key={n} className="text-warning">
                {n}
              </p>
            ))}
          </div>
        )}

        <div className="pt-5">
          <Tabs.Panel value="overview">
            {history.isError && history.matches.length === 0 ? (
              <ErrorState
                error={history.error}
                title="Historique indisponible"
                onRetry={() => void history.refetch()}
              />
            ) : !history.isPending && history.matches.length === 0 && !overview.isPending ? (
              <EmptyState
                title="Aucune partie sur cette période"
                description={`Aucune partie pour : ${text}. Élargissez la période ou changez de mode.`}
              />
            ) : (
              <OverviewLayout
                profile={profile}
                scope={scope}
                overview={overview}
                activity={data.activity}
                rankHistory={data.rankHistory}
                relationships={data.relationships}
                matches={history.matches}
                historyLoading={history.isPending}
                rows={data.rows}
                heroById={data.heroById}
                scopeQuery={scopeQuery}
                onSeeMatches={() => setTab("matches")}
              />
            )}
          </Tabs.Panel>
          <Tabs.Panel value="matches">
            <MatchesTab
              steamId={steamId}
              filters={filters}
              heroOptions={heroOptions}
              heroById={data.heroById}
              scopeText={text}
              onFilters={setMatchFilters}
            />
          </Tabs.Panel>
          <Tabs.Panel value="heroes">
            <HeroesTab
              rows={data.rows}
              heroById={data.heroById}
              selected={selectedHero}
              scopeText={text}
              state={
                data.playerHeroes.isPending
                  ? "loading"
                  : data.playerHeroes.isError
                    ? "error"
                    : "ready"
              }
            />
          </Tabs.Panel>
        </div>
      </Tabs.Root>

      {tab !== "overview" && <p className="text-xs text-subtle">{footnote}</p>}

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-b from-transparent to-bg to-30% px-4 pt-3 pb-6 sm:hidden">
        <FollowButton steamId={profile.player.steamId} name={profile.player.displayName} block />
      </div>
    </div>
  );
}

export function PlayerPage() {
  const { steamId = "" } = useParams();
  const player = usePlayer(steamId, { live: true });
  useDocumentTitle(player.data?.player.displayName ?? "Profil public");

  const viewed = player.data?.player;
  useEffect(() => {
    if (viewed)
      rememberPlayer({
        steamId: viewed.steamId,
        displayName: viewed.displayName,
        avatarUrl: viewed.avatarUrl,
      });
  }, [viewed]);

  if (player.isPending) return <BrandLoader message="Le Doorman monte les parties du joueur" />;

  if (player.isError) {
    if (isApiError(player.error) && player.error.status === 404) {
      return (
        <EmptyState
          icon="search"
          title="Joueur introuvable"
          description="Aucun joueur ne correspond à cet identifiant."
          action={
            <Link to="/search" className={buttonStyles("secondary")}>
              Nouvelle recherche
            </Link>
          }
        />
      );
    }
    return (
      <ErrorState
        error={player.error}
        title="Profil indisponible pour le moment"
        onRetry={() => void player.refetch()}
        extra={
          <Link to="/tracked" className={buttonStyles("secondary")}>
            Mes suivis
          </Link>
        }
      />
    );
  }

  return <Body steamId={steamId} profile={player.data} />;
}
