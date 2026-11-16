import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button, Input } from "@/components/ui";

interface SearchFormProps {
  initial?: string;
  large?: boolean;
  autoFocus?: boolean;
}

export function SearchForm({ initial = "", large = false, autoFocus = false }: SearchFormProps) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = q.trim();
    if (value) void navigate(`/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <form role="search" onSubmit={submit} className="flex w-full gap-2">
      <Input
        type="search"
        name="q"
        aria-label="Pseudo ou identifiant Steam"
        placeholder="Pseudo ou identifiant Steam"
        autoComplete="off"
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className={large ? "h-12 rounded-full px-5 text-base" : undefined}
      />
      <Button type="submit" className={large ? "h-12 rounded-full px-6" : undefined}>
        Rechercher
      </Button>
    </form>
  );
}
