import { act, render, screen } from "@testing-library/react";
import { triggerIntersection } from "../test/setup";
import Rule from "./Rule";

describe("Rule", () => {
  it("sweeps in once it enters the viewport", () => {
    render(<Rule />);
    const rule = screen.getByTestId("rule");
    expect(rule).not.toHaveClass("in");

    act(() => triggerIntersection(false));
    expect(rule).not.toHaveClass("in");

    act(() => triggerIntersection(true));
    expect(rule).toHaveClass("in");
  });
});
