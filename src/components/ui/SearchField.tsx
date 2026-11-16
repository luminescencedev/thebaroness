import type { ComponentProps } from "react";
import { cn } from "./cn";

export interface SearchFieldProps extends Omit<ComponentProps<"input">, "type"> {
  /** Libellé accessible (le champ n'a pas de label visible). */
  label: string;
}

/** Champ de recherche : loupe, anneau de focus sur le conteneur, effaçable au clavier (Échap). */
export function SearchField({ label, className, onKeyDown, ...props }: SearchFieldProps) {
  return (
    <label className={cn("search-field", className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        aria-hidden="true"
        className="size-[15px] shrink-0 text-subtle"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span className="sr-only">{label}</span>
      <input
        type="search"
        autoComplete="off"
        spellCheck={false}
        onKeyDown={onKeyDown}
        className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-subtle focus-visible:outline-none"
        {...props}
      />
    </label>
  );
}
