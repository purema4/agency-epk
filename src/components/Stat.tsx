import { useCountUp } from "../hooks/useCountUp";
import { useReducedMotion } from "../hooks/useMediaQuery";
import type { StatItem } from "../types";
import { isPlaceholder } from "../utils/stat";

interface StatProps extends StatItem {
  animate: boolean;
}

export default function Stat({ value, label, animate }: StatProps) {
  const reduce = useReducedMotion();
  const display = useCountUp(value, { start: animate, disabled: reduce });
  return (
    <div className={`stat${isPlaceholder(value) ? " placeholder" : ""}`}>
      <b>{display}</b>
      <span>{label}</span>
    </div>
  );
}
