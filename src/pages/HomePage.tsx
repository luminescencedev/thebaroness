import { Link } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { Card, buttonStyles } from "@/components/ui";
import { SearchForm } from "@/features/players/SearchForm";
import { useSession } from "@/features/auth/useSession";

const features = [
  {
    title: "Recherche",
    text: "Trouvez un joueur par pseudo ou identifiant Steam, sans créer de compte.",
  },
  {
    title: "Profil joueur",
    text: "Statistiques principales et historique des parties disponibles, avec leur date de collecte.",
  },
  {
    title: "Mes suivis",
    text: "Gardez une liste privée de joueurs, avec alias, note et tags.",
  },
];

export function HomePage() {
  useDocumentTitle("Accueil");
  const session = useSession();

  return (
    <div className="space-y-20">
      <section className="mx-auto flex max-w-2xl flex-col items-center pt-10 text-center sm:pt-16">
        <h1 className="text-4xl leading-[1.05] sm:text-6xl">
          Les statistiques Deadlock, en clair.
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
          Recherchez un joueur, consultez son profil et gardez vos joueurs à suivre au même endroit.
        </p>
        <div className="mt-9 w-full">
          <SearchForm large autoFocus />
        </div>
        {!session && (
          <p className="mt-5 text-sm text-subtle">
            La recherche est ouverte à tous.{" "}
            <Link to="/login" className="text-muted underline underline-offset-4 hover-text">
              Connectez-vous avec Steam
            </Link>{" "}
            pour suivre des joueurs.
          </p>
        )}
      </section>

      <section aria-label="Aperçu du site" className="grid gap-3 sm:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title}>
            <h2 className="text-lg">{f.title}</h2>
            <p className="mt-2 text-sm text-muted">{f.text}</p>
          </Card>
        ))}
      </section>

      {session && (
        <div className="text-center">
          <Link to="/tracked" className={buttonStyles("secondary")}>
            Voir mes suivis
          </Link>
        </div>
      )}
    </div>
  );
}
