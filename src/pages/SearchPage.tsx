import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Alert, Button, EmptyState, Skeleton, cn } from "@/components/ui";
import { usePlayerSearch } from "@/features/players/hooks";
import { HomonymGroup } from "@/features/search/HomonymGroup";
import { groupResults, MIN_QUERY, SEARCH_DEBOUNCE_MS, STEAM_ID_RE } from "@/features/search/model";
import { PlayerResultRow } from "@/features/search/PlayerResultRow";
import { clearRecents, rememberPlayer, useRecentPlayers } from "@/features/search/recents";
import { SearchBox } from "@/features/search/SearchBox";

const list = "card overflow-hidden";

function ResultsSkeleton() {
  return (
    <div className={list} aria-busy="true" aria-label="Chargement des résultats">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex h-[68px] items-center gap-3.5 border-t border-divider px-4 first:border-t-0"
        >
          <Skeleton className="!h-11 !w-11 shrink-0 !rounded-xl" />
          <span className="flex flex-1 flex-col gap-2">
            <Skeleton className="!h-3.5 w-[44%]" />
            <Skeleton className="!h-2.5 w-[62%]" />
          </span>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mx-1 mb-2 flex items-baseline justify-between gap-3">
      <h2 className="text-[13px] font-semibold text-muted">{title}</h2>
      {count !== undefined && <span className="text-xs text-subtle tabular-nums">{count}</span>}
    </div>
  );
}

/**
 * Recherche de joueurs. L'URL (`?q=`) est la source de vérité de la requête : la saisie est un brouillon
 * local, validé après 300 ms (remplace l'entrée d'historique, n'en crée pas) ou tout de suite avec Entrée.
 */
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const urlQ = (params.get("q") ?? "").trim();
  useDocumentTitle(urlQ ? `Recherche : ${urlQ}` : "Recherche");

  const [draft, setDraft] = useState(urlQ);
  const [committed, setCommitted] = useState(urlQ);
  const [seenUrl, setSeenUrl] = useState(urlQ);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const input = useRef<HTMLInputElement>(null);
  const recents = useRecentPlayers();

  // Changement d'URL venu d'ailleurs (palette, retour arrière) : le brouillon l'adopte. Les mises à jour
  // que cette page a elle-même validées sont reconnues (`committed`) et ne réécrasent pas la frappe en cours.
  if (urlQ !== seenUrl) {
    setSeenUrl(urlQ);
    if (urlQ !== committed) {
      setDraft(urlQ);
      setCommitted(urlQ);
    }
  }
  useEffect(() => () => clearTimeout(timer.current), []);

  const commit = (value: string) => {
    clearTimeout(timer.current);
    const t = value.trim();
    setCommitted(t);
    setParams(t ? { q: t } : {}, { replace: true });
  };

  const onChange = (value: string) => {
    setDraft(value);
    clearTimeout(timer.current);
    const t = value.trim();
    if (t === "") commit("");
    else if (t.length >= MIN_QUERY)
      timer.current = setTimeout(() => commit(value), SEARCH_DEBOUNCE_MS);
  };

  const onSubmit = () => {
    const t = draft.trim();
    if (STEAM_ID_RE.test(t)) {
      clearTimeout(timer.current);
      rememberPlayer({ steamId: t, displayName: t, avatarUrl: null });
      void navigate(`/players/${t}`);
    } else if (t.length >= MIN_QUERY) commit(draft);
    else input.current?.focus();
  };

  const isId = STEAM_ID_RE.test(urlQ);
  const searchable = urlQ.length >= MIN_QUERY && !isId;
  const search = usePlayerSearch(searchable ? urlQ : "");
  // Le brouillon n'est pas encore celui des résultats affichés : on les garde, atténués, avec leur terme.
  const settled = draft.trim() === urlQ;
  const grouped = search.data ? groupResults(search.data.items, urlQ) : null;
  const count = search.data?.items.length ?? 0;

  let hint = "Pseudo Steam ou SteamID64 à 17 chiffres.";
  if (draft.trim().length === 1) hint = `${MIN_QUERY} caractères minimum.`;
  else if (isId && settled) hint = "SteamID64 reconnu : le profil s'ouvre directement.";
  else if (searchable && search.isError) hint = `La recherche de « ${urlQ} » a échoué.`;
  else if (searchable && search.isFetching) hint = `Recherche de « ${urlQ} »…`;
  else if (searchable && search.data)
    hint = `${count} joueur${count > 1 ? "s" : ""} pour « ${urlQ} »`;

  let body;
  if (!urlQ) {
    body =
      recents.length > 0 ? (
        <section aria-labelledby="recents">
          <div className="mx-1 mb-2 flex items-center justify-between">
            <h2 id="recents" className="text-[13px] font-semibold text-muted">
              Récents
            </h2>
            <Button variant="ghost" size="sm" onClick={clearRecents}>
              Effacer
            </Button>
          </div>
          <ul className={list}>
            {recents.map((p) => (
              <li key={p.steamId}>
                <PlayerResultRow player={p} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <EmptyState
          icon="search"
          title="Lancez une recherche"
          description="Saisissez un pseudo Steam ou un SteamID64 à 17 chiffres."
        />
      );
  } else if (isId) {
    body = (
      <section>
        <SectionTitle title="SteamID64 reconnu" />
        <Link
          to={`/players/${urlQ}`}
          onClick={() => rememberPlayer({ steamId: urlQ, displayName: urlQ, avatarUrl: null })}
          className={cn(list, "row-link flex min-h-[68px] items-center gap-3.5 px-4")}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent-text">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-5"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-medium">Ouvrir ce profil</span>
            <span className="mono truncate text-xs text-subtle">{urlQ}</span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="row-chevron size-3.5 shrink-0 text-subtle"
          >
            <path
              d="m9 6 6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </section>
    );
  } else if (!searchable) {
    body = null;
  } else if (search.isError) {
    body = (
      <ErrorState
        error={search.error}
        title="Recherche impossible"
        onRetry={() => void search.refetch()}
        reassure={false}
      />
    );
  } else if (search.isPending) {
    body = <ResultsSkeleton />;
  } else if (count === 0) {
    body = (
      <EmptyState
        icon="search"
        title={`Aucun joueur pour « ${urlQ} »`}
        description="Vérifiez l'orthographe, ou collez un SteamID64 à 17 chiffres pour ouvrir un profil directement."
        action={<Button onClick={() => input.current?.select()}>Modifier la recherche</Button>}
      />
    );
  } else if (grouped) {
    const { exact, homonyms, similar } = grouped;
    const meta = search.data!.meta;
    body = (
      <div className="space-y-6">
        {meta.isPartial && (
          <Alert tone="info">
            Résultats partiels : la source répond lentement, la liste peut être incomplète.
          </Alert>
        )}
        {exact.length > 0 && (
          <section>
            <SectionTitle title="Correspondance exacte" />
            <ul className={list}>
              {exact.map((p) => (
                <li key={p.steamId}>
                  <PlayerResultRow player={p} query={urlQ} exact />
                </li>
              ))}
            </ul>
          </section>
        )}
        {homonyms.map((g) => (
          <HomonymGroup key={g.key} group={g} query={urlQ} />
        ))}
        {similar.length > 0 && (
          <section>
            <SectionTitle
              title={exact.length + homonyms.length > 0 ? "Pseudos proches" : "Résultats"}
              count={similar.length}
            />
            <ul className={list}>
              {similar.map((p) => (
                <li key={p.steamId}>
                  <PlayerResultRow player={p} query={urlQ} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <DataMetaNotice
          meta={{ ...meta, isPartial: false }}
          onRetry={() => void search.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[880px]">
      <PageHeader
        title="Recherche"
        description="Retrouvez un joueur par pseudo Steam ou par SteamID64."
      />
      <SearchBox
        value={draft}
        onChange={onChange}
        onSubmit={onSubmit}
        onClear={() => {
          setDraft("");
          commit("");
          input.current?.focus();
        }}
        busy={searchable && search.isFetching}
        inputRef={input}
      />
      <p className="mx-1 mt-2.5 mb-6 min-h-5 text-[12.5px] text-subtle" aria-live="polite">
        {hint}
      </p>
      <div className={cn("transition-opacity duration-150", !settled && "opacity-55")}>{body}</div>
    </div>
  );
}
