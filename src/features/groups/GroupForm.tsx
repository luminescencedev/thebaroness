import { useState, type FormEvent } from "react";
import { isApiError, type TrackedPlayer } from "@/api";
import { Avatar, Button, Field, Input, Spinner } from "@/components/ui";
import { usePlayerSearch } from "@/features/players/hooks";
import { useDebounced } from "@/lib/useDebounced";

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

/** Entrée libre : SteamID64, code ami, [U:1:n] ou lien de profil. Le back valide et normalise. */
const looksLikeId = (v: string) =>
  /^\d{5,}$/.test(v) || /steamcommunity\.com\//i.test(v) || /^\[U:1:\d+\]$/i.test(v);

/** Nom + 2 à 20 joueurs : par pseudo (recherche), parmi les suivis, ou par identifiant. */
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
  const serverMessage =
    isApiError(error) && [400, 409].includes(error.status) ? error.message : null;

  const q = term.trim();
  const debounced = useDebounced(q);
  const searching = debounced.length >= 2 && !looksLikeId(debounced);
  const results = usePlayerSearch(searching ? debounced : "");

  const add = (id: string, info?: Known) => {
    if (selected.includes(id)) return;
    setSelected((cur) => [...cur, id]);
    if (info) setKnown((cur) => ({ ...cur, [id]: info }));
    setTerm("");
  };
  const remove = (id: string) => setSelected((cur) => cur.filter((x) => x !== id));
  const label = (id: string) => known[id]?.name ?? id;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (name.trim().length < 1 || name.trim().length > 60)
      found.name = "Le nom doit contenir 1 à 60 caractères.";
    if (selected.length < 2) found.members = "Choisissez au moins 2 joueurs.";
    else if (selected.length > 20) found.members = "20 joueurs maximum.";
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit({ name: name.trim(), steamIds: selected });
  };

  const suggestions = (results.data?.items ?? [])
    .filter((p) => !selected.includes(p.steamId))
    .slice(0, 6);
  const trackedLeft = tracked.filter((t) => !selected.includes(t.steamId));

  return (
    <form onSubmit={submit} noValidate className="mt-5 space-y-4">
      <Field label="Nom du groupe" error={errors.name}>
        {(p) => (
          <Input {...p} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        )}
      </Field>

      <fieldset className="space-y-3">
        <legend className="text-[13px] font-medium text-muted">
          Joueurs ({selected.length} sélectionnés)
        </legend>

        {selected.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Joueurs du groupe">
            {selected.map((id) => (
              <li
                key={id}
                className="flex items-center gap-2 rounded-full border border-border-strong bg-surface py-0.5 pr-1 pl-0.5 text-sm"
              >
                <Avatar
                  name={label(id)}
                  src={known[id]?.avatarUrl}
                  className="size-6 text-[10px]"
                />
                <span className="max-w-[10rem] truncate">{label(id)}</span>
                <button
                  type="button"
                  aria-label={`Retirer ${label(id)}`}
                  onClick={() => remove(id)}
                  className="icon-btn pressable grid size-7 place-items-center rounded-full text-subtle"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                    className="size-3"
                  >
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="relative">
          <label className="sr-only" htmlFor="member-search">
            Ajouter un joueur
          </label>
          <Input
            id="member-search"
            value={term}
            placeholder="Pseudo, code ami, SteamID64 ou lien de profil Steam"
            autoComplete="off"
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (q && looksLikeId(q)) add(q);
                else if (suggestions[0])
                  add(suggestions[0].steamId, {
                    name: suggestions[0].displayName,
                    avatarUrl: suggestions[0].avatarUrl,
                  });
              }
            }}
          />
          {q.length >= 2 && (
            <ul
              className="mt-2 overflow-hidden rounded-control border border-border bg-[#0d0e11]"
              aria-label="Résultats de recherche"
            >
              {looksLikeId(q) ? (
                <li>
                  <button
                    type="button"
                    onClick={() => add(q)}
                    className="hover-text flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-white/[0.05]"
                  >
                    Ajouter <span className="mono text-text">{q}</span>
                  </button>
                </li>
              ) : (
                <>
                  {(results.isFetching || debounced !== q) && (
                    <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-subtle">
                      <Spinner className="size-3.5" /> Recherche en cours
                    </li>
                  )}
                  {results.isError && (
                    <li className="px-3 py-2.5 text-sm text-loss">Recherche indisponible.</li>
                  )}
                  {suggestions.map((p) => (
                    <li key={p.steamId}>
                      <button
                        type="button"
                        onClick={() =>
                          add(p.steamId, { name: p.displayName, avatarUrl: p.avatarUrl })
                        }
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-white/[0.05]"
                      >
                        <Avatar
                          name={p.displayName}
                          src={p.avatarUrl}
                          className="size-7 text-[10px]"
                        />
                        <span className="min-w-0 flex-1 truncate">{p.displayName}</span>
                        <span className="mono text-xs text-subtle">{p.steamId}</span>
                      </button>
                    </li>
                  ))}
                  {results.data && suggestions.length === 0 && !results.isFetching && (
                    <li className="px-3 py-2.5 text-sm text-subtle">Aucun joueur trouvé.</li>
                  )}
                </>
              )}
            </ul>
          )}
        </div>

        {trackedLeft.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-subtle">Parmi vos suivis</p>
            <ul className="flex flex-wrap gap-1.5">
              {trackedLeft.slice(0, 12).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => add(t.steamId, { name: t.alias || t.steamId, avatarUrl: null })}
                    className="pressable hover-text rounded-full border border-border px-3 py-1 text-[13px] text-muted"
                  >
                    + {t.alias || t.steamId}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {errors.members && <p className="text-[13px] text-loss">{errors.members}</p>}
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
