import { useLocation } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { Card } from "@/components/ui";

interface PlaceholderPageProps {
  title: string;
  /** Route déclarée, par exemple /players/:steamId. */
  route: string;
}

export function PlaceholderPage({ title, route }: PlaceholderPageProps) {
  useDocumentTitle(title);
  const { pathname, search } = useLocation();

  return (
    <Card className="max-w-xl">
      <h1 className="text-3xl">{title}</h1>
      <p className="mt-3 font-mono text-sm text-muted">{route}</p>
      <p className="mt-1 font-mono text-xs text-subtle">
        {pathname}
        {search}
      </p>
      <p className="mt-5 text-sm text-muted">À implémenter</p>
    </Card>
  );
}
