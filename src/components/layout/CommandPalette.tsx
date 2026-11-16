import { Command } from "cmdk";
import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { Dialog, Kbd } from "@/components/ui";
import { useSession } from "@/features/auth/useSession";
import { useHeroes } from "@/features/heroes/hooks";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEAM_ID_RE = /^\d{17}$/;

const groupClass =
  "px-1.5 pb-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-subtle [&_[cmdk-group-heading]]:uppercase";

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted data-[selected=true]:bg-surface-strong data-[selected=true]:text-text";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4 shrink-0 text-subtle">
      {children}
    </svg>
  );
}

const icons = {
  search: (
    <Icon>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Icon>
  ),
  page: (
    <Icon>
      <path
        d="M7 3h7l5 5v13H7z M14 3v5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Icon>
  ),
  user: (
    <Icon>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 21c1-4 4-6 8-6s7 2 8 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Icon>
  ),
};

/** Palette ⌘K. Aucune animation : action clavier fréquente. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const session = useSession();
  const heroes = useHeroes();
  const [query, setQuery] = useState("");

  const q = query.trim();
  const heroMatches = q
    ? (heroes.data?.items ?? [])
        .filter((h) => h.name.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 5)
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
    { value: "home", label: "Accueil", to: "/" },
    { value: "players", label: "Joueurs", to: "/search" },
    { value: "heroes", label: "Héros", to: "/heroes" },
    { value: "leaderboard", label: "Classement", to: "/leaderboard" },
    ...(session
      ? [
          { value: "tracked", label: "Mes suivis", to: "/tracked" },
          { value: "groups", label: "Groupes", to: "/groups" },
        ]
      : [{ value: "login", label: "Connexion Steam", to: "/login" }]),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="Recherche rapide"
      hideTitle
      animated={false}
      top
      className="max-w-xl overflow-hidden p-0"
    >
      <Command shouldFilter={false} label="Recherche rapide" loop>
        <div className="flex items-center gap-3 border-b border-border px-4">
          {icons.search}
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Chercher un joueur, un héros ou une page"
            className="h-14 w-full bg-transparent text-[15px] text-text placeholder:text-subtle focus:outline-none"
          />
          <Kbd aria-hidden="true">Échap</Kbd>
        </div>

        <Command.List className="max-h-[22rem] overflow-y-auto p-1.5">
          <Command.Empty className="px-3 py-8 text-center text-sm text-subtle">
            Aucun résultat.
          </Command.Empty>

          {q && (
            <Command.Group heading="Joueurs" className={groupClass}>
              {STEAM_ID_RE.test(q) && (
                <Command.Item
                  value={`steam-${q}`}
                  onSelect={() => go(`/players/${q}`)}
                  className={itemClass}
                >
                  {icons.user}
                  <span>
                    Ouvrir le profil <span className="mono text-text">{q}</span>
                  </span>
                </Command.Item>
              )}
              <Command.Item
                value={`search-${q}`}
                onSelect={() => go(`/search?q=${encodeURIComponent(q)}`)}
                className={itemClass}
              >
                {icons.search}
                <span>
                  Rechercher « <span className="text-text">{q}</span> »
                </span>
              </Command.Item>
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
                    rounded="full"
                    className="size-6"
                  />
                  <span className="flex-1">{h.name}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Pages" className={groupClass}>
            {pages.map((p) => (
              <Command.Item
                key={p.value}
                value={p.value}
                onSelect={() => go(p.to)}
                className={itemClass}
              >
                {icons.page}
                {p.label}
              </Command.Item>
            ))}
          </Command.Group>
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
        </div>
      </Command>
    </Dialog>
  );
}
