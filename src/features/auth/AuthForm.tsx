import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { isApiError, login, register } from "@/api";
import { Alert, Button, Card, Field, Input } from "@/components/ui";
import { errorMessage } from "@/lib/messages";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "./useSession";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const session = useSession();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const mutation = useMutation({
    mutationKey: ["auth"],
    mutationFn: () => (isLogin ? login : register)({ email: email.trim(), password }),
  });

  // La session est posée par le client API : on redirige dès qu'elle existe.
  if (session) return <Navigate to={from ?? "/tracked"} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) found.email = "Saisissez une adresse email valide.";
    if (isLogin ? password.length === 0 : password.length < 8)
      found.password = isLogin
        ? "Saisissez votre mot de passe."
        : "Le mot de passe doit contenir au moins 8 caractères.";
    setErrors(found);
    if (Object.keys(found).length === 0) mutation.mutate();
  };

  const error = mutation.error;
  const emailTaken = isApiError(error) && error.code === "EMAIL_ALREADY_USED";
  const emailError = errors.email ?? (emailTaken ? error.message : undefined);
  // Message générique : on ne révèle pas si l'email existe.
  const formError = error && !emailTaken ? errorMessage(error) : null;

  return (
    <Card className="mx-auto w-full max-w-md p-7">
      <h1 className="text-2xl">{isLogin ? "Connexion" : "Créer un compte"}</h1>
      <p className="mt-1.5 text-sm text-muted">
        {isLogin ? "Retrouvez vos joueurs suivis." : "Gardez une liste privée de joueurs à suivre."}
      </p>
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field label="Email" error={emailError}>
          {(p) => (
            <Input
              {...p}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        <Field
          label="Mot de passe"
          error={errors.password}
          hint={isLogin ? undefined : "8 caractères minimum."}
        >
          {(p) => (
            <Input
              {...p}
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" loading={mutation.isPending} className="w-full">
          {isLogin ? "Se connecter" : "Créer mon compte"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
        <Link
          to={isLogin ? "/register" : "/login"}
          state={from ? { from } : undefined}
          className="text-text underline underline-offset-4"
        >
          {isLogin ? "Créer un compte" : "Se connecter"}
        </Link>
      </p>
    </Card>
  );
}
