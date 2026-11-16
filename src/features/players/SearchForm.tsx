import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button, Input, Kbd, cn } from "@/components/ui";

interface SearchFormProps {
  initial?: string;
  /** « hero » : grand champ en verre de l'accueil, avec raccourci « / ». */
  variant?: "default" | "hero";
  autoFocus?: boolean;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SearchForm({
  initial = "",
  variant = "default",
  autoFocus = false,
}: SearchFormProps) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);

  // « / » met le focus sur la recherche de l'accueil, comme annoncé par le raccourci affiché.
  useEffect(() => {
    if (variant !== "hero") return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target && (["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = q.trim();
    if (value) void navigate(`/search?q=${encodeURIComponent(value)}`);
    else input.current?.focus();
  };

  if (variant === "hero") {
    return (
      <form
        role="search"
        onSubmit={submit}
        className="flex h-[60px] w-full items-center gap-3 rounded-2xl bg-[rgb(14_16_20/0.85)] pr-2 pl-[18px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.09),0_20px_50px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl transition-shadow duration-200 focus-within:shadow-[inset_0_0_0_1px_rgb(180_171_255/0.55),0_20px_50px_-20px_rgb(0_0_0/0.8),0_0_0_4px_rgb(91_75_240/0.18)]"
      >
        <SearchIcon className="size-[18px] shrink-0 text-subtle" />
        <input
          ref={input}
          type="search"
          name="q"
          aria-label="Pseudo Steam ou SteamID64"
          placeholder="Pseudo Steam ou SteamID64"
          autoComplete="off"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-base tracking-[-0.01em] text-text outline-none placeholder:text-subtle focus-visible:outline-none"
        />
        {q.length === 0 && <Kbd aria-hidden="true">/</Kbd>}
        <Button type="submit" className="h-11 rounded-[11px]">
          Rechercher
        </Button>
      </form>
    );
  }

  return (
    <form role="search" onSubmit={submit} className="flex w-full gap-2">
      <Input
        ref={input}
        type="search"
        name="q"
        aria-label="Pseudo Steam ou SteamID64"
        placeholder="Pseudo Steam ou SteamID64"
        autoComplete="off"
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className={cn("h-11")}
      />
      <Button type="submit" className="h-11">
        Rechercher
      </Button>
    </form>
  );
}
