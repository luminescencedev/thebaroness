import { Command } from "cmdk";
import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { logout } from "@/api";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { Avatar, Dialog, Kbd, Spinner, cn } from "@/components/ui";
import { useSession } from "@/features/auth/useSession";
import { useHeroes } from "@/features/heroes/hooks";
import { usePlayerSearch } from "@/features/players/hooks";
import { clearRecents, rememberPlayer, useRecentPlayers } from "@/features/search/recents";
import { useDebounced } from "@/lib/useDebounced";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEAM_ID_RE = /^\d{17}$/;

const groupClass =
  "px-2 pb-1.5 [&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:justify-between [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-subtle [&_[cmdk-group-heading]]:uppercase";

const itemClass =
  "group flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-muted transition-colors duration-100 data-[selected=true]:bg-white/[0.07] data-[selected=true]:text-text";

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      {children}
    </svg>
  );
}

const glyphs = {
  search: (
    <Glyph>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Glyph>
  ),
  home: (
    <Glyph>
      <path d="M4 11 12 4l8 7v9H4z" />
    </Glyph>
  ),
  users: (
    <Glyph>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.2 2.4 3.5 5.2" />
    </Glyph>
  ),
  shield: (
    <Glyph>
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
    </Glyph>
  ),
  trophy: (
    <Glyph>
      <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4" />
    </Glyph>
  ),
  bookmark: (
    <Glyph>
      <path d="M6 4h12v17l-6-4-6 4z" />
    </Glyph>
  ),
  plus: (
    <Glyph>
      <path d="M12 5v14M5 12h14" />
    </Glyph>
  ),
  steam: (
    <Glyph>
      <circle cx="12" cy="12" r="9" />
      <circle cx="15" cy="9.5" r="2" />
      <path d="m4 13 4.5 1.8M9 17l-1.3-.5" />
    </Glyph>
  ),
  out: (
    <Glyph>
      <path d="M9 4H5v16h4M15 8l4 4-4 4M19 12H9" />
    </Glyph>
  ),
  clock: (
    <Glyph>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Glyph>
  ),
  user: (
    <Glyph>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </Glyph>
  ),
};

function Tile({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]",
        tone === "accent" ? "bg-accent/20 text-accent-text" : "bg-white/[0.04] text-muted",
      )}
    >
      {children}
    </span>
  );
}

function OpenHint({ label = "Ouvrir" }: { label?: string }) {
  return (
    <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted group-data-[selected=true]:flex">
      {label}
      <Kbd aria-hidden="true">↵</Kbd>
    </span>
  );
}

/** Palette ⌘K : recherche de joueurs en direct, héros, récents, actions et pages. Aucune animation. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const session = useSession();
  const heroes = useHeroes();
  const recents = useRecentPlayers();
  const [query, setQuery] = useState("");

  const q = query.trim();
  const debounced = useDebounced(q);
  const searching = debounced.length >= 2 && !STEAM_ID_RE.test(debounced);
  const players = usePlayerSearch(searching ? debounced : "");
  const waiting = searching && (players.isFetching || debounced !== q);

  const needle = q.toLowerCase();
  const heroMatches = needle
    ? (heroes.data?.items ?? []).filter((h) => h.name.toLowerCase().includes(needle)).slice(0, 4)
    : [];

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setQuery("");
  };
  const go = (to: string) => {
    close(false);
    void navigate(to);
  };

  const pages = [
    { value: "home", label: "Accueil", to: "/", icon: glyphs.home },
    { value: "players", label: "Joueurs", to: "/search", icon: glyphs.users },
    { value: "heroes", label: "Héros", to: "/heroes", icon: glyphs.shield },
    { value: "leaderboard", label: "Classement", to: "/leaderboard", icon: glyphs.trophy },
    ...(session
      ? [
          { value: "tracked", label: "Mes suivis", to: "/tracked", icon: glyphs.bookmark },
          { value: "groups", label: "Groupes", to: "/groups", icon: glyphs.users },
        ]
      : []),
  ].filter((p) => !needle || p.label.toLowerCase().includes(needle));

  const actions = [
    ...(session
      ? [
          {
            value: "follow",
            label: "Suivre un joueur",
            hint: "Ouvre la recherche",
            run: () => go("/search"),
            icon: glyphs.plus,
          },
          {
            value: "group",
            label: "Créer un groupe",
            hint: "Comparer vos amis",
            run: () => go("/groups"),
            icon: glyphs.users,
          },
          {
            value: "logout",
            label: "Se déconnecter",
            hint: session.user.displayName,
            run: () => {
              logout();
              close(false);
            },
            icon: glyphs.out,
          },
        ]
      : [
          {
            value: "login",
            label: "Se connecter avec Steam",
            hint: "Sans mot de passe",
            run: () => go("/login"),
            icon: glyphs.steam,
          },
        ]),
  ].filter((a) => !needle || a.label.toLowerCase().includes(needle));

  const openPlayer = (p: { steamId: string; displayName: string; avatarUrl: string | null }) => {
    rememberPlayer(p);
    go(`/players/${p.steamId}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="Recherche rapide"
      description="Chercher un joueur, un héros ou une page"
      hideTitle
      animated={false}
      top
      className="max-w-[640px] overflow-hidden p-0"
    >
      <Command shouldFilter={false} label="Recherche rapide" loop>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <span className="grid size-[18px] place-items-center text-subtle">
            {waiting ? <Spinner className="size-4" /> : glyphs.search}
          </span>
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Chercher un joueur, un héros, une page…"
            className="h-14 w-full bg-transparent text-base tracking-[-0.01em] text-text placeholder:text-subtle focus:outline-none"
          />
          <Kbd aria-hidden="true">Échap</Kbd>
        </div>

        <Command.List className="max-h-[min(26rem,60vh)] overflow-y-auto p-1">
          <Command.Empty className="px-3 py-10 text-center text-sm text-subtle">
            {waiting ? "Recherche en cours…" : "Aucun résultat."}
          </Command.Empty>

          {STEAM_ID_RE.test(q) && (
            <Command.Group heading="Joueurs" className={groupClass}>
              <Command.Item
                value={`steam-${q}`}
                onSelect={() => openPlayer({ steamId: q, displayName: q, avatarUrl: null })}
                className={itemClass}
              >
                <Tile tone="accent">{glyphs.user}</Tile>
                <span className="flex min-w-0 flex-col">
                  <span className="text-text">Ouvrir ce profil</span>
                  <span className="mono text-xs text-subtle">{q}</span>
                </span>
                <OpenHint />
              </Command.Item>
            </Command.Group>
          )}

          {searching && (
            <Command.Group heading="Joueurs" className={groupClass}>
              {players.isPending && (
                <div className="space-y-1.5 px-1 pb-1" aria-hidden="true">
                  {[0, 1].map((i) => (
                    <div key={i} className="skeleton h-12 rounded-xl" />
                  ))}
                </div>
              )}
              {players.isError && (
                <p role="alert" className="px-2.5 py-3 text-[13px] text-loss">
                  Recherche indisponible pour le moment.
                </p>
              )}
              {players.data?.items.slice(0, 5).map((p) => (
                <Command.Item
                  key={p.steamId}
                  value={`player-${p.steamId}`}
                  onSelect={() => openPlayer(p)}
                  className={itemClass}
                >
                  <Avatar
                    name={p.displayName}
                    src={p.avatarUrl}
                    className="size-8 rounded-lg text-xs"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-text">{p.displayName}</span>
                    <span className="mono text-xs text-subtle">{p.steamId}</span>
                  </span>
                  <OpenHint label="Ouvrir le profil" />
                </Command.Item>
              ))}
              <Command.Item
                value={`all-${debounced}`}
                onSelect={() => go(`/search?q=${encodeURIComponent(q)}`)}
                className={itemClass}
              >
                <Tile>{glyphs.search}</Tile>
                <span>
                  Tous les résultats pour « <span className="text-text">{q}</span> »
                </span>
                <OpenHint label="Voir" />
              </Command.Item>
            </Command.Group>
          )}

          {!q && recents.length > 0 && (
            <Command.Group
              heading={
                <>
                  <span>Récents</span>
                  <button
                    type="button"
                    onClick={clearRecents}
                    className="hover-text rounded px-1 text-[11px] tracking-normal text-subtle normal-case"
                  >
                    Effacer
                  </button>
                </>
              }
              className={groupClass}
            >
              {recents.map((p) => (
                <Command.Item
                  key={p.steamId}
                  value={`recent-${p.steamId}`}
                  onSelect={() => openPlayer(p)}
                  className={itemClass}
                >
                  <Tile>{glyphs.clock}</Tile>
                  <span className="min-w-0 flex-1 truncate text-text">{p.displayName}</span>
                  <span className="mono hidden text-xs text-subtle group-data-[selected=true]:hidden sm:inline">
                    {p.steamId}
                  </span>
                  <OpenHint />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {heroMatches.length > 0 && (
            <Command.Group heading="Héros" className={groupClass}>
              {heroMatches.map((h) => (
                <Command.Item
                  key={h.id}
                  value={`hero-${h.id}`}
                  onSelect={() => go(`/heroes/${h.id}`)}
                  className={itemClass}
                >
                  <HeroPortrait
                    name={h.name}
                    src={h.images.small}
                    rounded="lg"
                    className="size-8"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-text">{h.name}</span>
                    <span className="text-xs text-subtle capitalize">{h.role}</span>
                  </span>
                  <OpenHint label="Voir la fiche" />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {actions.length > 0 && (
            <Command.Group heading="Actions" className={groupClass}>
              {actions.map((a) => (
                <Command.Item
                  key={a.value}
                  value={`action-${a.value}`}
                  onSelect={a.run}
                  className={itemClass}
                >
                  <Tile tone="accent">{a.icon}</Tile>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-text">{a.label}</span>
                    <span className="text-xs text-subtle">{a.hint}</span>
                  </span>
                  <OpenHint label="Lancer" />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {pages.length > 0 && (
            <Command.Group heading="Pages" className={groupClass}>
              {pages.map((p) => (
                <Command.Item
                  key={p.value}
                  value={`page-${p.value}`}
                  onSelect={() => go(p.to)}
                  className={itemClass}
                >
                  <Tile>{p.icon}</Tile>
                  <span className="text-text">{p.label}</span>
                  <OpenHint label="Aller à" />
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-xs text-subtle">
          <span className="flex items-center gap-1.5">
            <Kbd aria-hidden="true">↑</Kbd>
            <Kbd aria-hidden="true">↓</Kbd>
            Naviguer
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd aria-hidden="true">↵</Kbd>
            Ouvrir
          </span>
          <span className="ml-auto hidden whitespace-nowrap sm:inline">
            Recherche via notre API
          </span>
        </div>
      </Command>
    </Dialog>
  );
}
