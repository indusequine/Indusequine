"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Selection = {
  color: string | null;
  setColor: (color: string | null) => void;
};

const SelectionContext = createContext<Selection | null>(null);

/**
 * Holds which colour the rider has picked, so the gallery can follow the
 * picker.
 *
 * The two sit in opposite columns of the product page and neither can own the
 * state, so it lives here, around both. The page itself stays a server
 * component: this only wraps its children.
 */
export function ProductSelection({ children }: { children: ReactNode }) {
  const [color, setColor] = useState<string | null>(null);
  const value = useMemo(() => ({ color, setColor }), [color]);
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

/** Null outside a ProductSelection, so both components still work alone. */
export function useProductSelection(): Selection | null {
  return useContext(SelectionContext);
}
