import { useId, type ReactNode } from "react";
import { Label } from "./Label";

interface FieldProps {
  label: string;
  error?: string | null;
  hint?: string;
  /** Reçoit l'id du champ et les attributs ARIA d'association. */
  children: (props: {
    id: string;
    "aria-describedby": string | undefined;
    invalid: boolean;
  }) => ReactNode;
}

/** Label + champ + message d'erreur associés (htmlFor, aria-describedby). */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || hint);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        "aria-describedby": hasMessage ? messageId : undefined,
        invalid: Boolean(error),
      })}
      {error ? (
        <p id={messageId} className="text-[13px] text-loss">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-[13px] text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
