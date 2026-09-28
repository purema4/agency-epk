import { useState } from "react";
import { useReducedMotion } from "../hooks/useMediaQuery";
import Flag from "./Flag";

interface AnimatedNameProps {
  text: string;
  /** ISO country code; its flag rises in after the last letter. */
  country?: string;
}

// Each letter rises in on a stagger; once its animation ends it gets hover effects.
export default function AnimatedName({ text, country }: AnimatedNameProps) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState<Set<number>>(() => new Set());
  const markDone = (i: number) => setDone((d) => new Set(d).add(i));

  return (
    <div className="name-clip">
      <h1 className="name" aria-label={text}>
        {[...text].map((c, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{ "--i": i }}
            className={reduce || done.has(i) ? "done" : undefined}
            onAnimationEnd={() => markDone(i)}
          >
            {c === " " ? "\u00a0" : c /* a plain space collapses to nothing in the flex row */}
          </span>
        ))}
      </h1>
      <Flag country={country} className="name-flag" style={{ "--i": [...text].length }} />
    </div>
  );
}
