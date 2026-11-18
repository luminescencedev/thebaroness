import { useState, type FormEvent } from "react";
import { isApiError, type TrackedPlayer } from "@/api";
import { Avatar, Button, Field, Input, Spinner } from "@/components/ui";
import { usePlayerSearch } from "@/features/players/hooks";
import { homonymKeys, MIN_QUERY, normalizeName } from "@/features/search/model";
import { errorMessage } from "@/lib/messages";
import { useDebounced } from "@/lib/useDebounced";
import { GROUP_LIMITS, looksLikeId } from "./limits";

interface Known {
  name: string;
  avatarUrl: string | null;
}

interface GroupFormProps {
  tracked: TrackedPlayer[];
  initial?: { name: string; steamIds: string[] };
  submitLabel: string;
  pending?: boolean;
  error?: unknown;
  onSubmit: (values: { name: string; steamIds: string[] }) => void;
  onCancel: () => void;
}

const shortId = (id: string) => (/^\d{17}$/.test(id) ? `…${id.slice(-6)}` : id);

function Id({ id, emphasize }: { id: string; emphasize?: boolean }) {
  if (!emphasize || !/^\d{17}$/.test(id))
    return <span className="mono text-xs text-subtle">{id}</span>;
  return (
    <span className="mono text-xs text-subtle">
      {id.slice(0, -6)}
      <b className="font-semibold text-[#d9dbe1]">{id.slice(-6)}</b>
    </span>
  );
}

/** Nom + 2 à 20 joueurs : par pseudo (recherche partagée), parmi les suivis, ou par identifiant. */
export function GroupForm({
  tracked,
  initial,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: GroupFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [selected, setSelected] = useState<string[]>(initial?.steamIds ?? []);
  const [known, setKnown] = useState<Record<string, Known>>(() =>
    Object.fromEntries(
      tracked.map((t) => [t.steamId, { name: t.alias || t.steamId, avatarUrl: null }]),
    ),
  );
  const [term, setTerm] = useState("");
  const [errors, setErrors] = useState<{ name?: string; members?: string }>({});
  // 401 : géré globalement (session expirée). Le reste s'affiche ici, la saisie est conservée.
  const serverMessage =
    error && !(isApiError(error) && error.status === 401) ? errorMessage(error) : null;

  const q = term.trim();
  const debounced = useDebounced(q);
  const searching = debounced.length >= MIN_QUERY && !looksLikeId(debounced);
  const results = usePlayerSearch(searching ? debounced : "");

  const [notice, setNotice] = useState<string | null>(null);
  const add = (id: string, info?: Known) => {
    if (selected.includes(id)) {
      // Doublon : on vide la saisie (sinon elle se mêlerait à la suivante) et on le dit.
      setTerm("");
      setNotice(`${known[id]?.name ?? shortId(id)} est déjà dans le groupe.`);
      return;
    }
    if (selected.length >= GROUP_LIMITS.membersMax) return;
    setNotice(null);
    setSelected((cur) => [...cur, id]);
    if (info) setKnown((cur) => ({ ...cur, [id]: info }));
    setTerm("");
    setErrors((e) => ({ ...e, members: undefined }));
  };
  const remove = (id: string) => setSelected((cur) => cur.filter((x) => x !== id));
  const label = (id: string) => known[id]?.name ?? shortId(id);
  const full = selected.length >= GROUP_LIMITS.membersMax;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    const n = name.trim();
    if (n.length < 1 || n.length > GROUP_LIMITS.nameMax)
      found.name = `Le nom doit contenir 1 à ${GROUP_LIMITS.nameMax} caractères.`;
    if (selected.length < GROUP_LIMITS.membersMin)
      found.members = `Choisissez au moins ${GROUP_LIMITS.membersMin} joueurs.`;
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit({ name: n, steamIds: selected });
  };

  const found = results.data?.items ?? [];
  const same = homonymKeys(found);
  const shown = found.slice(0, 8);
  const trackedLeft = tracked.filter((t) => !selected.includes(t.steamId));

  return (
    <form onSubmit={submit} noValidate className="mt-5 space-y-5">
      <Field label="Nom du groupe" error={errors.name}>
        {(p) => (
          <Input
            {...p}
            value={name}
            maxLength={GROUP_LIMITS.nameMax}
            onChange={(e) => setName(e.target.value)}
          />
        )}
      </Field>

      <fieldset className="space-y-3">
        <legend className="flex w-full items-baseline justify-between text-[13px] font-medium text-muted">
          <span>Joueurs</span>
          <span className="font-normal text-subtle tabular-nums" aria-live="polite">
            {selected.length} sur {GROUP_LIMITS.membersMax} · {GROUP_LIMITS.membersMin} minimum
          </span>
        </legend>

        {selected.length > 0 && (
          <ul className="card overflow-hidden" aria-label="Joueurs du groupe">
            {selected.map((id) => (
              <li
                key={id}
                className="flex min-h-12 items-center gap-2.5 border-t border-divider py-1.5 pr-1.5 pl-3 first:border-t-0"
              >
                <Avatar
                  name={label(id)}
                  src={known[id]?.avatarUrl}
                  className="size-7 text-[10px]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{label(id)}</span>
                  {known[id] && known[id].name !== id && <Id id={id} />}
                </span>
                <button
                  type="button"
                  aria-label={`Retirer ${label(id)}`}
                  onClick={() => remove(id)}
                  className="icon-btn pressable grid size-9 place-items-center rounded-[10px] text-subtle"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                    className="size-3.5"
                  >
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div>
          <label className="sr-only" htmlFor="member-search">
            Ajouter un joueur
          </label>
          <Input
            id="member-search"
            value={term}
            disabled={full}
            placeholder={
              full
                ? "20 joueurs : retirez-en un pour en ajouter"
                : "Pseudo, SteamID64, code ami ou [U:1:n]"
            }
            autoComplete="off"
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const first = shown.find((p) => !selected.includes(p.steamId));
              if (q && looksLikeId(q)) add(q);
              else if (first)
                add(first.steamId, { name: first.displayName, avatarUrl: first.avatarUrl });
            }}
          />
          {q.length >= MIN_QUERY && (
            <ul className="card mt-2 overflow-hidden" aria-label="Résultats de recherche">
              {looksLikeId(q) ? (
                <li>
                  <button
                    type="button"
                    onClick={() => add(q)}
                    className="row-link flex min-h-12 w-full items-center gap-3 px-3 text-left text-sm"
                  >
                    Ajouter <span className="mono text-text">{q}</span>
                  </button>
                </li>
              ) : (
                <>
                  {(results.isFetching || debounced !== q) && (
                    <li className="flex items-center gap-2 px-3 py-3 text-sm text-subtle">
                      <Spinner className="size-3.5" /> Recherche en cours
                    </li>
                  )}
                  {results.isError && (
                    <li role="alert" className="px-3 py-3 text-sm text-loss">
                      {errorMessage(results.error)}
                    </li>
                  )}
                  {shown.map((p) => {
                    const already = selected.includes(p.steamId);
                    const twin = same.has(normalizeName(p.displayName));
                    return (
                      <li key={p.steamId} className="border-t border-divider first:border-t-0">
                        <button
                          type="button"
                          disabled={already}
                          onClick={() =>
                            add(p.steamId, { name: p.displayName, avatarUrl: p.avatarUrl })
                          }
                          className="row-link flex min-h-12 w-full items-center gap-3 px-3 py-1.5 text-left text-sm disabled:cursor-default disabled:opacity-55"
                        >
                          <Avatar
                            name={p.displayName}
                            src={p.avatarUrl}
                            className="size-8 text-[10px]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-medium">{p.displayName}</span>
                              {twin && (
                                <span className="shrink-0 rounded-full border border-warning/30 bg-warning/10 px-2 text-[11px] text-[#f2c98a]">
                                  même pseudo
                                </span>
                              )}
                            </span>
                            <Id id={p.steamId} emphasize={twin} />
                          </span>
                          <span className="shrink-0 text-xs text-subtle">
                            {already ? "Déjà dans le groupe" : "Ajouter"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {found.length > shown.length && (
                    <li className="border-t border-divider px-3 py-2.5 text-xs text-subtle">
                      {found.length} résultats : affinez la recherche ou collez un SteamID64.
                    </li>
                  )}
                  {results.data && found.length === 0 && !results.isFetching && (
                    <li className="px-3 py-3 text-sm text-subtle">Aucun joueur trouvé.</li>
                  )}
                </>
              )}
            </ul>
          )}
        </div>

        {trackedLeft.length > 0 && !full && (
          <div>
            <p className="mb-1.5 text-xs text-subtle">Parmi vos suivis</p>
            <ul className="flex flex-wrap gap-1.5">
              {trackedLeft.slice(0, 12).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => add(t.steamId, { name: t.alias || t.steamId, avatarUrl: null })}
                    className="pressable hover-text min-h-9 rounded-full border border-border px-3 text-[13px] text-muted"
                  >
                    + {t.alias || shortId(t.steamId)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {notice && (
          <p role="status" className="text-[13px] text-muted">
            {notice}
          </p>
        )}
        {errors.members && (
          <p role="alert" className="text-[13px] text-loss">
            {errors.members}
          </p>
        )}
      </fieldset>

      {serverMessage && (
        <p role="alert" className="text-[13px] text-loss">
          {serverMessage}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
