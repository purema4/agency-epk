import { fireEvent, render, screen } from "@testing-library/react";
import { setMediaQueries } from "../test/setup";
import AnimatedName from "./AnimatedName";

describe("AnimatedName", () => {
  it("splits the name into staggered, screen-reader-hidden letters", () => {
    render(<AnimatedName text="ABC" />);
    const h1 = screen.getByRole("heading", { name: "ABC" });
    const letters = h1.querySelectorAll("span");
    expect(letters).toHaveLength(3);
    letters.forEach((s, i) => {
      expect(s).toHaveAttribute("aria-hidden", "true");
      expect(s.style.getPropertyValue("--i")).toBe(String(i));
      expect(s).not.toHaveClass("done");
    });
  });

  it("marks a letter done when its animation ends", () => {
    render(<AnimatedName text="AB" />);
    const [a, b] = screen.getByRole("heading").querySelectorAll("span");
    fireEvent.animationEnd(a);
    expect(a).toHaveClass("done");
    expect(b).not.toHaveClass("done");
  });

  it("skips the animation with reduced motion", () => {
    setMediaQueries("(prefers-reduced-motion: reduce)");
    render(<AnimatedName text="AB" />);
    screen
      .getByRole("heading")
      .querySelectorAll("span")
      .forEach((s) => expect(s).toHaveClass("done"));
  });
});
