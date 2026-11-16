export interface TrackedValues {
  alias: string;
  note: string;
  tags: string[];
}

/** Règles de la section 7.2 du cahier des charges (le serveur reste l'autorité). */
export function validateTracked(v: TrackedValues): Partial<Record<keyof TrackedValues, string>> {
  const errors: Partial<Record<keyof TrackedValues, string>> = {};
  if (v.alias.trim().length > 80) errors.alias = "80 caractères maximum.";
  if (v.note.trim().length > 1000) errors.note = "1000 caractères maximum.";
  if (v.tags.length > 10) errors.tags = "10 tags maximum.";
  else if (v.tags.some((t) => t.length > 24)) errors.tags = "24 caractères maximum par tag.";
  return errors;
}
