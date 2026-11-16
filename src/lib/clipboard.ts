import { toast } from "sonner";

/** Copie dans le presse-papiers avec retour (toast). Repli silencieux si l'API est indisponible. */
export async function copyText(text: string, message: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error("Copie impossible sur cet appareil.");
  }
}
