import { useState } from "react";
import { useReducedMotion } from "../hooks/useMediaQuery";

interface AnimatedNameProps {
  text: string;
}

// Each letter rises in on a stagger; once its animation ends it gets hover effects.
export default function AnimatedName({ text }: AnimatedNameProps) {
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
            {c}
          </span>
        ))}
      </h1>
    </div>
  );
}
