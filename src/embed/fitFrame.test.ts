import { fitFrameToContent } from "./fitFrame";

// A stand-in for the iframe window GoDaddy runs the component in.
function framedWindow(bodyHeight: number) {
  const observers: Array<() => void> = [];
  const frame = { style: { height: "", transition: "" } };
  const win = {
    frameElement: frame,
    document: {
      documentElement: { style: { overflow: "" } },
      body: { getBoundingClientRect: () => ({ height: bodyHeight }) },
    },
    ResizeObserver: class {
      constructor(cb: () => void) {
        observers.push(cb);
      }
      observe() {}
    },
  };
  return {
    win: win as unknown as Window,
    frame,
    html: win.document.documentElement,
    resize(height: number) {
      bodyHeight = height;
      observers.forEach((cb) => cb());
    },
    observerCount: () => observers.length,
  };
}

describe("fitFrameToContent", () => {
  it("sizes the iframe to its content and hides the inner scrollbar", () => {
    const f = framedWindow(480.4);
    fitFrameToContent(f.win);
    expect(f.frame.style.height).toBe("481px");
    expect(f.html.style.overflow).toBe("hidden");
    expect(f.frame.style.transition).toBe("none");
  });

  it("follows the content as it grows and shrinks (loading screen -> EPK)", () => {
    const f = framedWindow(480);
    fitFrameToContent(f.win);
    f.resize(3200);
    expect(f.frame.style.height).toBe("3200px");
    f.resize(2900);
    expect(f.frame.style.height).toBe("2900px");
  });

  it("sets up once per window, however many components are on the page", () => {
    const f = framedWindow(480);
    fitFrameToContent(f.win);
    fitFrameToContent(f.win);
    expect(f.observerCount()).toBe(1);
  });

  it("does nothing outside an iframe or in a cross-origin one", () => {
    // jsdom's own window is not framed.
    fitFrameToContent(window);
    expect(document.documentElement.style.overflow).toBe("");

    const crossOrigin = {
      get frameElement(): never {
        throw new DOMException("Blocked", "SecurityError");
      },
    } as unknown as Window;
    expect(() => fitFrameToContent(crossOrigin)).not.toThrow();
    expect(() => fitFrameToContent(null)).not.toThrow();
  });
});
