import { Tabs } from "@base-ui/react/tabs";
import { Link, useParams, useSearchParams } from "react-router";
import { useEffect } from "react";
import { isApiError } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { BrandLoader } from "@/components/brand";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState, Skeleton, buttonStyles } from "@/components/ui";
import { usePlayer } from "@/features/players/hooks";
import { HeroesTab } from "@/features/players/profile/HeroesTab";
import { MatchesTab } from "@/features/players/profile/MatchesTab";
import { OverviewTab } from "@/features/players/profile/OverviewTab";
import { ProfileBanner } from "@/features/players/profile/ProfileBanner";
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

  const data = useProfileData(steamId);
  const { history, stats } = data;
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
  const coverage = `Calculé sur ${history.loaded} partie${history.loaded > 1 ? "s" : ""} disponible${history.loaded > 1 ? "s" : ""} via Deadlock API, projet communautaire indépendant de Valve.${profile.meta.isPartial ? " Données partielles : l'historique peut être incomplet." : " L'historique peut être incomplet."} KDA = (éliminations + assistances) / max(morts, 1), calculé sur les sommes. Valeur nette par minute = valeur nette / durée.`;

  const loading = history.isPending;
  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <ProfileBanner profile={profile} heroColor={heroColor} />
      <DataMetaNotice meta={profile.meta} showDate={false} />

      <Tabs.Root value={tab} onValueChange={setTab}>
        <div className="sticky top-[76px] z-30 -mx-4 bg-bg/80 px-4 backdrop-blur-md sm:-mx-6 sm:px-6">
          <Tabs.List
            aria-label="Sections du profil"
            className="relative mx-auto flex max-w-6xl gap-1 border-b border-border"
          >
            {TABS.map((t) => (
              <Tabs.Tab
                key={t.value}
                value={t.value}
                className="pressable hover-text h-11 px-3.5 text-sm font-medium text-subtle data-[selected]:text-text"
              >
                {t.label}
                {t.value === "matches" && history.loaded > 0 && (
                  <span className="ml-1.5 text-xs text-subtle tabular-nums">{history.loaded}</span>
                )}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator className="absolute -bottom-px left-0 h-0.5 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-sm bg-text transition-[translate,width] duration-[220ms] ease-[var(--ease-in-out)] motion-reduce:transition-none" />
          </Tabs.List>
        </div>

        <div className="pt-6">
          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Chargement de l'historique">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-36 rounded-card" />
                ))}
              </div>
              <Skeleton className="h-72 rounded-card" />
            </div>
          ) : history.isError && history.matches.length === 0 ? (
            <ErrorState
              error={history.error}
              title="Historique indisponible"
              onRetry={() => void history.refetch()}
            />
          ) : (
            <>
              <Tabs.Panel value="overview">
                {history.matches.length === 0 ? (
                  <EmptyState
                    title="Aucune partie disponible"
                    description="Aucune partie n'est disponible pour ce joueur pour le moment."
                  />
                ) : (
                  <OverviewTab
                    profile={profile}
                    matches={history.matches}
                    stats={stats}
                    roles={data.roles}
                    rows={data.rows}
                    heroById={data.heroById}
                    coverage={coverage}
                    onSeeMatches={() => setTab("matches")}
                  />
                )}
              </Tabs.Panel>
              <Tabs.Panel value="matches">
                <MatchesTab
                  matches={history.matches}
                  heroById={data.heroById}
                  capped={history.capped}
                  hasMore={Boolean(history.hasNextPage)}
                  loading={history.isFetchingNextPage}
                  onMore={() => void history.fetchNextPage()}
                />
              </Tabs.Panel>
              <Tabs.Panel value="heroes">
                <HeroesTab rows={data.rows} heroById={data.heroById} />
              </Tabs.Panel>
            </>
          )}
        </div>
      </Tabs.Root>

      {tab !== "overview" && <p className="text-xs text-subtle">{coverage}</p>}

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-b from-transparent to-bg to-30% px-4 pt-3 pb-6 sm:hidden">
        <FollowButton steamId={profile.player.steamId} name={profile.player.displayName} block />
      </div>
    </div>
  );
}

export function PlayerPage() {
  const { steamId = "" } = useParams();
  const player = usePlayer(steamId);
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
