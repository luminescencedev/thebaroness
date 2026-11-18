import { useEffect, type FormEvent, type RefObject } from "react";
import { SearchIcon } from "@/components/layout/icons";
import { DoubleBezel, Kbd, Spinner } from "@/components/ui";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  busy: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}

/** Champ principal de /search : même famille que la landing (double bezel flottant), plus bas. « / » le focalise. */
export function SearchBox({ value, onChange, onSubmit, onClear, busy, inputRef }: SearchBoxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (["INPUT", "TEXTAREA"].includes(t.tagName) || t.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputRef]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form role="search" onSubmit={submit}>
      <DoubleBezel
        size="lg"
        elevation="floating"
        className="transition-shadow duration-200 focus-within:shadow-[var(--shadow-floating),0_0_0_4px_rgb(171_153_255/0.1)]"
        innerClassName="flex min-h-[60px] items-center gap-3.5 overflow-visible bg-[linear-gradient(180deg,#292a31,#1c1d23)] pr-3.5 pl-[18px] sm:min-h-[68px] sm:gap-4 sm:pr-[18px] sm:pl-[22px]"
      >
        <SearchIcon className="size-5 shrink-0 text-subtle sm:size-[22px]" />
        <input
          ref={inputRef}
          type="search"
          name="q"
          aria-label="Pseudo Steam ou SteamID64"
          placeholder="Pseudo ou SteamID64"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-base font-medium tracking-[-0.016em] text-text outline-none placeholder:text-[#8c8e9a] focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {busy && <Spinner className="shrink-0 text-subtle" />}
        {value ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Effacer la saisie"
            className="icon-btn pressable grid size-9 shrink-0 place-items-center rounded-[10px] text-muted"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="size-4"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        ) : (
          <Kbd aria-hidden="true" className="max-sm:hidden">
            /
          </Kbd>
        )}
      </DoubleBezel>
    </form>
  );
}
