import { useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Dialog,
  DoubleBezel,
  EmptyState,
  Field,
  IconButton,
  Input,
  Kbd,
  SearchField,
  Segmented,
  Skeleton,
  Tag,
  Textarea,
} from "@/components/ui";

const SURFACES = [
  ["canvas", "--canvas"],
  ["panel", "--panel"],
  ["surface-1", "--surface-1"],
  ["surface-2", "--surface-2"],
  ["surface-3", "--surface-3"],
] as const;
const RADII = [
  ["xs 8", "--radius-xs"],
  ["controle 10", "--radius"],
  ["md 14", "--radius-md"],
  ["card 16", "--radius-card"],
  ["lg 20", "--radius-lg"],
  ["panel 26", "--radius-panel"],
] as const;
const SHADOWS = ["contact", "card", "raised", "floating", "panel", "popover", "modal"] as const;
const DATA = [
  ["violet", "--data-violet"],
  ["cyan", "--data-cyan"],
  ["amber", "--data-amber"],
  ["win", "--data-win"],
  ["loss", "--data-loss"],
] as const;

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Controls() {
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("30d");
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("Texte de démonstration");
  return (
    <>
      <Block title="Boutons icône, recherche, segments">
        <div className="flex flex-wrap items-center gap-3">
          <IconButton label="Fermer">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
              className="size-[18px]"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </IconButton>
          <IconButton label="Fermer (petit)" size="sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
              className="size-4"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </IconButton>
          <IconButton label="Désactivé" disabled>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
              className="size-[18px]"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </IconButton>
          <Segmented
            ariaLabel="Période de démonstration"
            value={seg}
            onChange={setSeg}
            options={[
              { value: "7d", label: "7 jours" },
              { value: "30d", label: "30 jours" },
              { value: "season", label: "Saison" },
            ]}
          />
        </div>
        <SearchField
          label="Recherche de démonstration"
          placeholder="Filtrer"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
      </Block>

      <Block title="Champs : défaut, erreur, désactivé, compteur">
        <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
          <Field label="Alias" hint="Le nom affiché dans votre liste." aside="12 / 80">
            {(p) => <Input {...p} defaultValue="Duo régulier" />}
          </Field>
          <Field label="Alias en erreur" error="Maximum 80 caractères.">
            {(p) => <Input {...p} defaultValue="Trop long" />}
          </Field>
          <Field label="Désactivé">
            {(p) => <Input {...p} disabled defaultValue="Non modifiable" />}
          </Field>
          <Field label="Note" aside={`${note.length} / 1 000`}>
            {(p) => <Textarea {...p} value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
        </div>
      </Block>

      <Block title="Alertes, avatars, état vide, dialogue">
        <div className="grid max-w-3xl gap-2">
          <Alert tone="info">
            Données partielles : seules les parties disponibles sont prises en compte.
          </Alert>
          <Alert tone="warning">Source lente. Données affichées depuis le cache.</Alert>
          <Alert tone="error">La connexion avec Steam a échoué. Réessayez.</Alert>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name="Corvid" className="size-6 text-[10px]" />
          <Avatar name="Corvid" className="size-9 text-xs" />
          <Avatar name="Corvid" />
          <Avatar name="Corvid" className="size-14 text-xl" />
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Ouvrir un dialogue
          </Button>
        </div>
        <EmptyState
          icon="search"
          title="Aucun résultat"
          description="Essayez un autre pseudo ou un SteamID64."
          action={<Button variant="secondary">Réinitialiser</Button>}
          className="max-w-xl"
        />
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Dialogue de démonstration"
          description="Échap ou clic extérieur pour fermer."
        >
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => setOpen(false)}>Confirmer</Button>
          </div>
        </Dialog>
      </Block>
    </>
  );
}

/** Laboratoire de design system, route `/dev/ui`, développement seulement. */
export function DevUiPage() {
  return (
    <div className="space-y-10">
      <h1 className="text-3xl">Baroness UI</h1>

      <Block title="Surfaces">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SURFACES.map(([n, v]) => (
            <div
              key={n}
              className="rounded-[14px] border border-border p-3 text-xs text-muted"
              style={{ background: `var(${v})` }}
            >
              {n}
              <br />
              <span className="font-mono text-subtle">{v}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Rayons">
        <div className="flex flex-wrap gap-3">
          {RADII.map(([n, v]) => (
            <div
              key={n}
              className="grid size-20 place-items-center border border-border-strong bg-surface-1 text-[11px] text-muted"
              style={{ borderRadius: `var(${v})` }}
            >
              {n}
            </div>
          ))}
        </div>
      </Block>

      <Block title="Ombres">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SHADOWS.map((s) => (
            <div
              key={s}
              className="grid h-20 place-items-center rounded-[14px] bg-surface-1 text-xs text-muted"
              style={{ boxShadow: `var(--shadow-${s})` }}
            >
              {s}
            </div>
          ))}
        </div>
      </Block>

      <Block title="Couleurs de données (OKLCH)">
        <div className="flex flex-wrap gap-3">
          {DATA.map(([n, v]) => (
            <span key={n} className="inline-flex items-center gap-2 text-xs text-muted">
              <i className="size-4 rounded-full" style={{ background: `var(${v})` }} />
              {n}
            </span>
          ))}
        </div>
      </Block>

      <Block title="Double bezel : tailles, élévation, états">
        <div className="grid gap-4 md:grid-cols-3">
          {(["sm", "md", "lg"] as const).map((size) => (
            <DoubleBezel key={size} size={size} innerClassName="p-5">
              <p className="text-sm font-semibold">size {size}</p>
              <p className="mt-1 text-xs text-muted">
                Rayon externe, padding et rayon interne concentriques.
              </p>
            </DoubleBezel>
          ))}
          <DoubleBezel interactive innerClassName="p-5">
            <button type="button" className="text-left text-sm font-semibold outline-none">
              interactive
            </button>
            <p className="mt-1 text-xs text-muted">Survol doux, appui, anneau de focus.</p>
          </DoubleBezel>
          <DoubleBezel tone="accent" elevation="floating" innerClassName="p-5">
            <p className="text-sm font-semibold">tone accent, floating</p>
            <p className="mt-1 text-xs text-muted">Un seul par écran.</p>
          </DoubleBezel>
          <DoubleBezel aria-disabled="true" innerClassName="p-5">
            <p className="text-sm font-semibold">disabled</p>
          </DoubleBezel>
        </div>
      </Block>

      <Block title="Boutons, champs, tags">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Tag>Tag</Tag>
          <Kbd>⌘K</Kbd>
        </div>
        <div className="max-w-sm">
          <Input placeholder="Champ" aria-label="Champ" />
        </div>
      </Block>

      <Controls />

      <Block title="Chargement">
        <div className="grid max-w-md gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      </Block>
    </div>
  );
}
