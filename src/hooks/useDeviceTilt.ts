import { useCallback, useEffect, useRef, useState } from "react";

export type TiltPermission = "unsupported" | "prompt" | "granted" | "denied";

// iOS 13+ adds a static requestPermission() that must be called from a user gesture.
type OrientationEventCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

const orientationCtor = (): OrientationEventCtor | undefined =>
  typeof window !== "undefined" ? (window.DeviceOrientationEvent as OrientationEventCtor | undefined) : undefined;

function initialPermission(): TiltPermission {
  const ctor = orientationCtor();
  if (!ctor) return "unsupported";
  return typeof ctor.requestPermission === "function" ? "prompt" : "granted";
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/** Degrees of tilt away from the resting angle that map to a full -1..1 swing. */
const RANGE = 20;
/** How fast the resting angle follows the way the phone is held (per event). */
const RECENTER = 0.01;

/**
 * Calls `onTilt(x, y)` with values in -1..1 as the device tilts, measured from the angle it is
 * being held at (which slowly re-centres), so holding the phone at any angle looks neutral.
 */
export function useDeviceTilt(onTilt: (x: number, y: number) => void, enabled: boolean) {
  const [permission, setPermission] = useState<TiltPermission>(initialPermission);
  const cb = useRef(onTilt);
  cb.current = onTilt;

  useEffect(() => {
    if (!enabled || permission !== "granted") return;
    let base: { x: number; y: number } | null = null;

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      // Keep "left/right" and "up/down" relative to the screen when the phone is rotated.
      const angle = window.screen?.orientation?.angle ?? 0;
      const [x, y] =
        angle === 90 ? [e.beta, -e.gamma] : angle === 270 || angle === -90 ? [-e.beta, e.gamma] : [e.gamma, e.beta];

      if (!base) base = { x, y };
      base.x += (x - base.x) * RECENTER;
      base.y += (y - base.y) * RECENTER;
      cb.current(clamp((x - base.x) / RANGE), clamp((y - base.y) / RANGE));
    };

    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [enabled, permission]);

  const request = useCallback(async () => {
    const ctor = orientationCtor();
    if (typeof ctor?.requestPermission !== "function") return;
    try {
      setPermission((await ctor.requestPermission()) === "granted" ? "granted" : "denied");
    } catch {
      setPermission("denied");
    }
  }, []);

  return { permission, request };
}
