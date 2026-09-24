import { useEffect, useRef } from "react";
import { useMediaQuery, useReducedMotion } from "../hooks/useMediaQuery";

const INTERACTIVE = "a,button,.tag,.stat,.chart li,.name,.booking,.platforms";

// Custom trailing cursor for fine pointers, shown only over the EPK (its parent element).
// Position is written straight to the DOM each frame to avoid re-rendering on every pointer move.
export default function Cursor() {
  const fine = useMediaQuery("(pointer: fine)");
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const enabled = fine && !reduce;

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    const area = el?.parentElement;
    if (!el || !area) return;
    let cx = 0, cy = 0, tx = 0, ty = 0, raf: number;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.classList.add("on");
      el.classList.toggle("big", !!(e.target as Element | null)?.closest?.(INTERACTIVE));
    };
    const onLeave = () => el.classList.remove("on");
    const loop = () => {
      cx += (tx - cx) * 0.25;
      cy += (ty - cy) * 0.25;
      el.style.transform = `translate(${cx}px,${cy}px)`;
      raf = requestAnimationFrame(loop);
    };

    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={ref} className="cursor" data-testid="cursor" aria-hidden="true" />;
}
