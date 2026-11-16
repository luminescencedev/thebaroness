import { createContext, useContext } from "react";

export const PaletteContext = createContext<{ open: () => void }>({ open: () => {} });

/** Ouvre la palette ⌘K depuis n'importe quelle page. */
export const usePalette = () => useContext(PaletteContext);
