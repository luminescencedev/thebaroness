import { Link } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { EmptyState, buttonStyles } from "@/components/ui";

export function NotFoundPage() {
  useDocumentTitle("Page introuvable");
  return (
    <EmptyState
      className="mx-auto max-w-xl"
      title="Page introuvable"
      description="Cette page n'existe pas ou a été déplacée."
      action={
        <Link to="/" className={buttonStyles("primary")}>
          Retour à l&apos;accueil
        </Link>
      }
    />
  );
}
