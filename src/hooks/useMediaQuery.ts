import { useEffect, useState } from "react";

const query = (q: string): MediaQueryList | undefined =>
  typeof window !== "undefined" ? window.matchMedia?.(q) : undefined;

export function useMediaQuery(q: string): boolean {
  const [matches, setMatches] = useState(() => !!query(q)?.matches);
  useEffect(() => {
    const mql = query(q);
    if (!mql) return;
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [q]);
  return matches;
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
