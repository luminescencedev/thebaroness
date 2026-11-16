import { useDocumentTitle } from "@/app/useDocumentTitle";
import { AuthForm } from "@/features/auth/AuthForm";

export function RegisterPage() {
  useDocumentTitle("Créer un compte");
  return <AuthForm mode="register" />;
}
