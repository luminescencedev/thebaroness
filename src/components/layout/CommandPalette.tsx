import { Command } from "cmdk";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Dialog } from "@/components/ui";
import { useSession } from "@/features/auth/useSession";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const itemClass =
  "flex cursor-pointer items-center rounded-control px-3 py-2 text-sm text-muted data-[selected=true]:bg-surface-strong data-[selected=true]:text-text";

/** Palette ⌘K. Aucune animation : action clavier fréquente. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const session = useSession();
  const [query, setQuery] = useState("");

  const go = (to: string) => {
    onOpenChange(false);
    setQuery("");
    void navigate(to);
  };
  const q = query.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Recherche rapide"
      animated={false}
      top
      className="max-w-lg p-2"
    >
      <Command shouldFilter={false} label="Recherche rapide" className="mt-2">
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Pseudo, identifiant Steam ou page"
          className="h-11 w-full border-b border-border bg-transparent px-3 text-sm text-text placeholder:text-subtle focus:outline-none"
        />
        <Command.List className="max-h-72 overflow-y-auto p-1.5">
          <Command.Empty className="px-3 py-6 text-center text-sm text-subtle">
            Aucun résultat.
          </Command.Empty>
          {q && (
            <Command.Group
              heading="Joueurs"
              className="text-xs text-subtle [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5"
            >
              <Command.Item
                value={`search-${q}`}
                onSelect={() => go(`/search?q=${encodeURIComponent(q)}`)}
                className={itemClass}
              >
                Rechercher « {q} »
              </Command.Item>
            </Command.Group>
          )}
          <Command.Group
            heading="Pages"
            className="text-xs text-subtle [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5"
          >
            <Command.Item value="home" onSelect={() => go("/")} className={itemClass}>
              Accueil
            </Command.Item>
            <Command.Item value="players" onSelect={() => go("/search")} className={itemClass}>
              Joueurs
            </Command.Item>
            {session ? (
              <Command.Item value="tracked" onSelect={() => go("/tracked")} className={itemClass}>
                Mes suivis
              </Command.Item>
            ) : (
              <>
                <Command.Item value="login" onSelect={() => go("/login")} className={itemClass}>
                  Connexion
                </Command.Item>
                <Command.Item
                  value="register"
                  onSelect={() => go("/register")}
                  className={itemClass}
                >
                  Créer un compte
                </Command.Item>
              </>
            )}
          </Command.Group>
        </Command.List>
      </Command>
    </Dialog>
  );
}
