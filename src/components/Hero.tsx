import { useCallback, useRef, type PointerEvent } from "react";
import { useDeviceTilt } from "../hooks/useDeviceTilt";
import { useMediaQuery, useReducedMotion } from "../hooks/useMediaQuery";
import type { Epk } from "../types";
import AnimatedName from "./AnimatedName";
import PlatformLinks from "./PlatformLinks";
import Tag from "./Tag";

type HeroProps = Pick<Epk, "name" | "label" | "kicker" | "photo" | "tags" | "platforms">;

// Max photo shift in px: pointer on desktop, gyroscope on touch devices.
const POINTER_SHIFT = { x: 18, y: 12 };
const TILT_SHIFT = { x: 12, y: 10 };

export default function Hero({ name, label, kicker, photo, tags, platforms }: HeroProps) {
  const reduce = useReducedMotion();
  const touch = useMediaQuery("(pointer: coarse)");
  const imgRef = useRef<HTMLImageElement>(null);

  // Written straight to the element: tilt events arrive ~60 times a second.
  const shift = useCallback((x: number, y: number) => {
    const s = imgRef.current?.style;
    s?.setProperty("--px", `${x}px`);
    s?.setProperty("--py", `${y}px`);
  }, []);

  const tilt = useDeviceTilt((x, y) => shift(x * -TILT_SHIFT.x, y * -TILT_SHIFT.y), touch && !reduce);

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    shift((x - 0.5) * -POINTER_SHIFT.x, (y - 0.5) * -POINTER_SHIFT.y);
  };

  return (
    <header
      className="hero"
      onPointerMove={onPointerMove}
      onPointerLeave={(e) => e.pointerType !== "touch" && shift(0, 0)}
    >
      <div className="hero-photo">
        <img ref={imgRef} src={photo.src} alt={photo.alt} style={{ "--px": "0px", "--py": "0px" }} />
      </div>

      {touch && !reduce && tilt.permission === "prompt" && (
        <button type="button" className="tilt-btn" onClick={tilt.request}>
          Enable motion
        </button>
      )}

      <div className="wrap topbar">
        <span>{label}</span>
        <span>{kicker}</span>
      </div>

      <div className="wrap hero-bottom">
        <AnimatedName text={name} />
        <div className="meta">
          <div className="tags">
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
          <PlatformLinks platforms={platforms} />
        </div>
      </div>
    </header>
  );
}
