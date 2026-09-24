import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "../mocks/node";

// Mock API for every test; unmocked requests fail loudly.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

// matchMedia: every query is false unless a test enables it with setMediaQueries().
let active = new Set<string>();
export function setMediaQueries(...queries: string[]) {
  active = new Set(queries);
}
window.matchMedia = vi.fn(
  (q: string) =>
    ({
      matches: active.has(q),
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as MediaQueryList
);

// IntersectionObserver: tests call triggerIntersection() to simulate scrolling into view.
const observers = new Set<MockIntersectionObserver>();
class MockIntersectionObserver {
  els = new Set<Element>();
  constructor(private cb: IntersectionObserverCallback) {
    observers.add(this);
  }
  observe(el: Element) {
    this.els.add(el);
  }
  unobserve(el: Element) {
    this.els.delete(el);
  }
  disconnect() {
    this.els.clear();
    observers.delete(this);
  }
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

export function triggerIntersection(isIntersecting = true) {
  for (const o of [...observers]) {
    const entries = [...o.els].map((target) => ({ target, isIntersecting }) as IntersectionObserverEntry);
    if (entries.length) o["cb"](entries, o as unknown as IntersectionObserver);
  }
}

afterEach(() => {
  cleanup();
  server.resetHandlers();
  active = new Set();
  observers.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
