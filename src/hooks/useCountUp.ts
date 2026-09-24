import { useEffect, useState } from "react";
import { easeOutQuart, formatStat, parseStat } from "../utils/stat";

interface CountUpOptions {
  start: boolean;
  duration?: number;
  disabled?: boolean;
}

// Animates a numeric stat string from 0 to its value once `start` is true.
// Non-numeric values (like "XX") are returned unchanged.
export function useCountUp(value: string, { start, duration = 1400, disabled = false }: CountUpOptions): string {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const p = parseStat(value);
    if (!start || disabled || !p) {
      setDisplay(value);
      return;
    }
    let raf: number;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      if (k < 1) {
        setDisplay(formatStat(p, p.n * easeOutQuart(k)));
        raf = requestAnimationFrame(step);
      } else {
        setDisplay(value);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, start, duration, disabled]);
  return display;
}
