import type { ProfileScope } from "@/api";
import { Segmented } from "@/components/ui";
import { GAME_MODES, MATCH_MODES, PERIODS } from "../scope";

const select =
  "h-9 rounded-[10px] border border-border-strong bg-surface px-3 text-[13px] text-muted outline-none focus-visible:outline-2 focus-visible:outline-focus";

/** Scope statistique partagé par tous les onglets : période, format de jeu, type de partie. */
export function ScopeBar({
  scope,
  onChange,
}: {
  scope: ProfileScope;
  onChange: (patch: Partial<ProfileScope>) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Périmètre des statistiques"
      className="flex flex-wrap items-center gap-2"
    >
      <Segmented
        ariaLabel="Période"
        size="sm"
        value={scope.period}
        onChange={(period) => onChange({ period })}
        options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
      />
      <label className="sr-only" htmlFor="scope-format">
        Format de jeu
      </label>
      <select
        id="scope-format"
        className={select}
        value={scope.gameMode}
        onChange={(e) => onChange({ gameMode: e.target.value as ProfileScope["gameMode"] })}
      >
        {GAME_MODES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="scope-type">
        Type de partie
      </label>
      <select
        id="scope-type"
        className={select}
        value={scope.matchMode}
        onChange={(e) => onChange({ matchMode: e.target.value as ProfileScope["matchMode"] })}
      >
        {MATCH_MODES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
