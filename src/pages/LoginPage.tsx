import { useDocumentTitle } from "@/app/useDocumentTitle";
import { AuthForm } from "@/features/auth/AuthForm";

export function LoginPage() {
  useDocumentTitle("Connexion");
  return <AuthForm mode="login" />;
}
