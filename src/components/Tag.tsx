import { useState, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useMediaQuery";

interface TagProps {
  children: ReactNode;
}

// Genre tag that drifts toward the pointer.
export default function Tag({ children }: TagProps) {
  const reduce = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOffset({
      x: (e.clientX - r.left - r.width / 2) * 0.18,
      y: (e.clientY - r.top - r.height / 2) * 0.3,
    });
  };

  return (
    <div
      className="tag"
      style={{ "--tx": `${offset.x}px`, "--ty": `${offset.y}px` }}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setOffset({ x: 0, y: 0 })}
    >
      {children}
    </div>
  );
}
