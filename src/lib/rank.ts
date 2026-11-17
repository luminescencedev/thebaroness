import { ROMAN } from "./stats";

/** « Oracle 4 » devient « Oracle IV » : nom du rang et sous-rang en chiffres romains. */
export function rankLabel(name: string | null, subrank: number | null | undefined): string | null {
  if (!name) return null;
  const base = name.replace(/\s+\d+$/, "");
  return subrank && ROMAN[subrank] ? `${base} ${ROMAN[subrank]}` : name;
}
