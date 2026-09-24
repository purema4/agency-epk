import { act, fireEvent, render, screen } from "@testing-library/react";
import { rect } from "../test/utils";
import ScrollProgress from "./ScrollProgress";

describe("ScrollProgress", () => {
  it("tracks scrolling through its container, not the whole page", () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
    render(
      <div data-testid="epk">
        <ScrollProgress />
      </div>
    );
    const epk = screen.getByTestId("epk");
    const bar = screen.getByTestId("progress");
    const scrollTo = (top: number) =>
      act(() => {
        vi.spyOn(epk, "getBoundingClientRect").mockReturnValue(rect(0, top, 400, 3000));
        fireEvent.scroll(window);
      });

    scrollTo(600); // EPK still below the fold (host page content above it)
    expect(bar.style.transform).toBe("scaleX(0)");

    scrollTo(-1000); // halfway: 1000 of (3000 - 1000) scrolled
    expect(bar.style.transform).toBe("scaleX(0.5)");

    scrollTo(-5000); // past the end
    expect(bar.style.transform).toBe("scaleX(1)");
  });
});
