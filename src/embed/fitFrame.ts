// GoDaddy shows custom code in a same-origin iframe and sizes it by asking the iframe for its body
// height, early on, before the EPK has loaded. The iframe then stays too short and the EPK scrolls
// inside it. When the component can reach its iframe, it keeps the iframe as tall as the content
// itself and hides the iframe's scrollbar. On a normal page (or a cross-origin frame) it does nothing.

const fitted = new WeakSet<Window>();

// The iframe's own ResizeObserver (TypeScript's Window type doesn't list constructors).
type FramedWindow = Window & { ResizeObserver?: typeof ResizeObserver };

export function fitFrameToContent(win: FramedWindow | null): void {
  if (!win || fitted.has(win)) return;

  let frame: HTMLElement | null = null;
  try {
    frame = win.frameElement as HTMLElement | null; // null when not framed or cross-origin
  } catch {
    return;
  }
  if (!frame || typeof win.ResizeObserver !== "function") return;
  fitted.add(win);

  const { documentElement, body } = win.document;
  // The iframe always matches the content, so a scrollbar would only ever flash while it grows.
  documentElement.style.overflow = "hidden";
  // GoDaddy animates height changes over 1.5s; jump straight to the right size instead.
  frame.style.transition = "none";

  const fit = () => {
    const height = Math.ceil(body.getBoundingClientRect().height);
    if (height > 0) frame.style.height = `${height}px`;
  };
  new win.ResizeObserver!(fit).observe(body);
  fit();
}
