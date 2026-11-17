import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { DoubleBezel, Kbd } from "@/components/ui";
import { SearchIcon } from "@/components/layout/icons";

/** Grande recherche de la landing : double bezel flottant, raccourci « / », même route que partout. */
export function HeroSearch() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (["INPUT", "TEXTAREA"].includes(t.tagName) || t.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = q.trim();
    if (value) void navigate(`/search?q=${encodeURIComponent(value)}`);
    else input.current?.focus();
  };

  return (
    <form role="search" onSubmit={submit} className="mx-auto w-full max-w-[860px]">
      <DoubleBezel
        size="lg"
        elevation="floating"
        className="transition-shadow duration-200 focus-within:shadow-[var(--shadow-floating),0_0_0_4px_rgb(171_153_255/0.1)]"
        innerClassName="flex min-h-[60px] items-center gap-4 sm:gap-5 overflow-visible bg-[linear-gradient(180deg,#292a31,#1c1d23)] pr-5 pl-5 sm:min-h-[76px] sm:pr-7 sm:pl-6"
      >
        <SearchIcon className="size-5 text-subtle sm:size-6" />
        <input
          ref={input}
          type="search"
          name="q"
          aria-label="Pseudo Steam ou SteamID64"
          placeholder="Pseudo ou SteamID64"
          autoComplete="off"
          spellCheck={false}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] font-medium tracking-[-0.016em] text-text outline-none placeholder:text-[#8c8e9a] focus-visible:outline-none sm:text-[17px]"
        />
        {q.length === 0 && (
          <Kbd aria-hidden="true" className="max-sm:hidden">
            /
          </Kbd>
        )}
        <button
          type="submit"
          className="pressable inline-flex h-9 shrink-0 cursor-pointer items-center rounded-[10px] border border-[rgb(171_153_255/0.35)] bg-[rgb(124_106_245/0.18)] px-3.5 text-[12.5px] font-semibold text-[#d9d2ff] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[rgb(124_106_245/0.3)]"
        >
          Rechercher
        </button>
      </DoubleBezel>
    </form>
  );
}
