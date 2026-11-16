const KEY = "baroness:return-to";

/** Page à rouvrir après la connexion Steam. Chemin interne uniquement, aucune donnée sensible. */
export function saveReturnTo(path: string | undefined): void {
  try {
    if (path && path.startsWith("/") && !path.startsWith("//")) sessionStorage.setItem(KEY, path);
  } catch {
    /* stockage indisponible : on retombera sur /tracked */
  }
}

export function takeReturnTo(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
  } catch {
    return null;
  }
}
