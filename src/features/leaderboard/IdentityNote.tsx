import { Popover } from "@base-ui/react/popover";

const NOTES = {
  inferred: {
    label: "déduit",
    aria: "Compte déduit : voir l'explication",
    text: "Pseudo partagé par plusieurs comptes Steam. Le compte affiché est celui au meilleur rang, puis à la partie classée la plus récente.",
    tone: "border-warning/30 bg-warning/10 text-[#f2c98a]",
  },
  unlinked: {
    label: "non relié",
    aria: "Compte non relié : voir l'explication",
    text: "La source du classement ne relie ce pseudo à aucun compte Steam, ou à plusieurs sans rang connu. Aucun profil à ouvrir.",
    tone: "border-border-strong bg-white/[0.04] text-muted",
  },
} as const;

/**
 * Pastille d'identité d'une ligne du classement, avec son explication. Au survol, au focus et au toucher :
 * le texte reste lisible sans dépendre de la souris. Posée au-dessus du lien étiré de la ligne (z-10).
 */
export function IdentityNote({ kind }: { kind: keyof typeof NOTES }) {
  const note = NOTES[kind];
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={150}
        aria-label={note.aria}
        className={`relative z-10 inline-flex h-5 shrink-0 cursor-help items-center gap-1 rounded-full border px-2 text-[11px] font-medium whitespace-nowrap ${note.tone}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="size-[11px]"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
        {note.label}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} collisionPadding={12} className="z-50">
          <Popover.Popup className="menu-popup surface-solid max-w-[min(calc(100vw-24px),264px)] rounded-xl px-3 py-2.5 text-xs leading-relaxed text-text outline-none">
            {note.text}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
