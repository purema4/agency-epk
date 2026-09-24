import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { ToastProvider } from "../components/Toast";

// Fresh client per test so cached data never leaks between tests; no retries unless a test opts in.
export const testQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

export function renderWithQuery(ui: ReactElement, client = testQueryClient()) {
  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) };
}

export const renderWithToast = (ui: ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);

// Fake timers that also drive requestAnimationFrame and performance.now().
export const RAF_TIMERS: Parameters<typeof vi.useFakeTimers>[0] = {
  toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"],
};

// Minimal DOMRect for mocking getBoundingClientRect (jsdom always returns zeros).
export const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, x: left, y: top, right: left + width, bottom: top + height }) as DOMRect;

// querySelector that fails the test instead of returning null.
export function $<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`No element matches ${selector}`);
  return el;
}

// ---- Device orientation (gyroscope) fakes; jsdom has no DeviceOrientationEvent ----

/** Android-style: events fire without asking. iOS-style: pass the answer requestPermission() gives. */
export function installDeviceOrientation(ios?: "granted" | "denied" | Error) {
  class FakeDeviceOrientationEvent extends Event {}
  const requestPermission = vi.fn(() => (ios instanceof Error ? Promise.reject(ios) : Promise.resolve(ios)));
  if (ios !== undefined) Object.assign(FakeDeviceOrientationEvent, { requestPermission });
  Object.defineProperty(window, "DeviceOrientationEvent", { configurable: true, value: FakeDeviceOrientationEvent });
  return { requestPermission };
}

export function uninstallDeviceOrientation() {
  delete (window as { DeviceOrientationEvent?: unknown }).DeviceOrientationEvent;
}

export function tiltDevice(beta: number | null, gamma: number | null) {
  window.dispatchEvent(Object.assign(new Event("deviceorientation"), { beta, gamma }));
}
