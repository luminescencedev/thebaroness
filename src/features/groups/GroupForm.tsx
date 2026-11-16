import { useState, type FormEvent } from "react";
import { isApiError, type TrackedPlayer } from "@/api";
import { Button, Field, Input } from "@/components/ui";

interface GroupFormProps {
  tracked: TrackedPlayer[];
  initial?: { name: string; steamIds: string[] };
  submitLabel: string;
  pending?: boolean;
  error?: unknown;
  onSubmit: (values: { name: string; steamIds: string[] }) => void;
  onCancel: () => void;
}

const STEAM_ID_RE = /^\d{17}$/;

/** Nom + 2 à 20 joueurs : choisis parmi les suivis, ou ajoutés par SteamID. */
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
  const [extra, setExtra] = useState("");
  const [extraError, setExtraError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; members?: string }>({});
  const serverMessage = isApiError(error) && error.status === 400 ? error.message : null;

  const trackedIds = new Set(tracked.map((t) => t.steamId));
  const manual = selected.filter((id) => !trackedIds.has(id));

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const addExtra = () => {
    const id = extra.trim();
    if (!STEAM_ID_RE.test(id)) return setExtraError("Un SteamID64 contient 17 chiffres.");
    if (selected.includes(id)) return setExtraError("Ce joueur est déjà dans le groupe.");
    setSelected([...selected, id]);
    setExtra("");
    setExtraError(null);
  };

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

  return (
    <form onSubmit={submit} noValidate className="mt-5 space-y-4">
      <Field label="Nom du groupe" error={errors.name}>
        {(p) => (
          <Input {...p} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        )}
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-[13px] font-medium text-muted">
          Joueurs ({selected.length} sélectionnés)
        </legend>
        {tracked.length === 0 ? (
          <p className="text-sm text-subtle">
            Vous ne suivez encore aucun joueur : ajoutez-en par SteamID ci-dessous.
          </p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-control border border-border p-1.5">
            {tracked.map((t) => (
              <li key={t.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm hover:bg-surface">
                  <input
                    type="checkbox"
                    checked={selected.includes(t.steamId)}
                    onChange={() => toggle(t.steamId)}
                    className="size-4 accent-[var(--accent)]"
                  />
                  <span className="min-w-0 flex-1 truncate">{t.alias || "Sans alias"}</span>
                  <span className="mono text-xs text-subtle">{t.steamId}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {manual.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {manual.map((id) => (
              <li
                key={id}
                className="mono flex items-center gap-1.5 rounded-full border border-border-strong px-2.5 py-0.5 text-xs text-muted"
              >
                {id}
                <button
                  type="button"
                  aria-label={`Retirer ${id}`}
                  onClick={() => toggle(id)}
                  className="text-subtle hover-text"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        {errors.members && <p className="text-[13px] text-loss">{errors.members}</p>}
      </fieldset>

      <Field label="Ajouter par SteamID" error={extraError} hint="17 chiffres, puis Entrée.">
        {(p) => (
          <Input
            {...p}
            className="mono"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addExtra();
              }
            }}
          />
        )}
      </Field>

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
