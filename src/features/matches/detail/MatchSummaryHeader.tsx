import { useEffect, useRef, useState } from "react";
import type { MatchDetail } from "@/api";
import { DoubleBezel, cn } from "@/components/ui";
import { NA, formatCompact, formatDateTime, formatDuration, formatInt } from "@/lib/format";
import { GAME_MODE_LABEL, MATCH_MODE_LABEL } from "@/lib/modes";
import { TEAM_META } from "@/lib/teams";
import { teamTotal, type BoardTeam } from "./model";

const RESULT = {
  win: { label: "Victoire", cls: "text-win" },
  loss: { label: "Défaite", cls: "text-loss" },
  unknown: { label: "Résultat inconnu", cls: "text-subtle" },
} as const;

function CopyId({ id }: { id: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setState("ok");
    } catch {
      setState("fail");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2000);
  };
  return (
    <span className="inline-flex items-center gap-2">
      <span className="mono text-subtle">Partie {id}</span>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label="Copier l'identifiant de la partie"
        className="pressable hover-text inline-flex h-7 items-center gap-1.5 rounded-lg bg-surface px-2 text-[11px] text-muted shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)] outline-none focus-visible:outline-2 focus-visible:outline-focus"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
        Copier
      </button>
      <span role="status" className="text-[11px] text-subtle">
        {state === "ok" ? "Identifiant copié" : state === "fail" ? "Copie impossible" : ""}
      </span>
    </span>
  );
}

/** Résultat compact : équipes, total des éliminations, durée, date, format, rang moyen, identifiant. */
export function MatchSummaryHeader({ match, teams }: { match: MatchDetail; teams: BoardTeam[] }) {
  const mode = [
    match.matchMode ? MATCH_MODE_LABEL[match.matchMode] : null,
    match.gameMode && match.gameMode !== "normal" ? GAME_MODE_LABEL[match.gameMode] : null,
  ].filter(Boolean);
  const meta = [
    mode.length ? mode.join(" · ") : null,
    match.durationSeconds === null ? null : `Durée ${formatDuration(match.durationSeconds)}`,
    match.playedAt ? formatDateTime(match.playedAt) : null,
  ].filter((v): v is string => !!v && v !== NA);
  const kills = teams.map((t) => teamTotal(t, "kills"));

  const souls = teams.map((t) => teamTotal(t, "netWorth"));

  return (
    <DoubleBezel as="section" aria-label="Résultat de la partie" innerClassName="p-3 sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-6">
        {teams.map((t, i) => {
          const r = RESULT[t.result];
          const right = i === 1;
          return (
            <div key={t.side} className={cn("min-w-0 space-y-1", right && "order-3 text-right")}>
              <p className={cn("text-[11px] font-semibold tracking-[0.08em] uppercase", r.cls)}>
                {r.label}
              </p>
              <p
                className="text-sm leading-tight font-semibold max-[360px]:text-[13px] sm:text-2xl"
                style={{ color: TEAM_META[t.side].color }}
              >
                {TEAM_META[t.side].label}
              </p>
              <p className="text-[11px] text-subtle">
                Rang moyen <span className="font-medium text-muted">{t.averageRankName ?? NA}</span>
              </p>
            </div>
          );
        })}
        <div className="order-2 text-center">
          <p
            className="flex items-center justify-center gap-1.5 text-base font-semibold tabular-nums sm:gap-3 sm:text-xl md:text-3xl sm:text-3xl"
            aria-label={`Souls totaux : ${teams.map((t, i) => `${TEAM_META[t.side].label} ${formatInt(souls[i]?.value)}`).join(", ")}`}
          >
            <span style={{ color: teams[0] && TEAM_META[teams[0].side].color }}>
              {formatCompact(souls[0]?.value)}
            </span>
            <span className="text-base text-subtle">:</span>
            <span style={{ color: teams[1] && TEAM_META[teams[1].side].color }}>
              {formatCompact(souls[1]?.value)}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-subtle">Souls de l'équipe</p>
          <p className="mt-0.5 text-[11px] text-subtle tabular-nums">
            Éliminations : {formatInt(kills[0]?.value)} / {formatInt(kills[1]?.value)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/[0.06] pt-3 text-xs text-muted">
        <p>{meta.join(" · ") || NA}</p>
        <CopyId id={match.matchId} />
      </div>
    </DoubleBezel>
  );
}
