import { Wordmark } from "./Wordmark";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:px-6">
        <Wordmark />
        <p className="max-w-2xl text-[13px] leading-relaxed text-subtle">
          Statistiques : Deadlock API, projet communautaire indépendant de Valve. The Baroness
          n&apos;est affilié ni à Valve ni aux organisations du jeu.
        </p>
      </div>
    </footer>
  );
}
