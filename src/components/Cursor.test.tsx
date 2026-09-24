import { act, fireEvent, render, screen } from "@testing-library/react";
import { setMediaQueries } from "../test/setup";
import Cursor from "./Cursor";

describe("Cursor", () => {
  it("is not rendered on touch devices", () => {
    render(<Cursor />);
    expect(screen.queryByTestId("cursor")).not.toBeInTheDocument();
  });

  it("is not rendered with reduced motion", () => {
    setMediaQueries("(pointer: fine)", "(prefers-reduced-motion: reduce)");
    render(<Cursor />);
    expect(screen.queryByTestId("cursor")).not.toBeInTheDocument();
  });

  it("appears on pointer move and grows over interactive elements", () => {
    setMediaQueries("(pointer: fine)");
    render(
      <>
        <Cursor />
        <p>plain</p>
        <button>click</button>
      </>
    );
    const cursor = screen.getByTestId("cursor");
    expect(cursor).not.toHaveClass("on");

    act(() => fireEvent.pointerMove(screen.getByText("plain"), { clientX: 10, clientY: 10 }));
    expect(cursor).toHaveClass("on");
    expect(cursor).not.toHaveClass("big");

    act(() => fireEvent.pointerMove(screen.getByText("click"), { clientX: 20, clientY: 20 }));
    expect(cursor).toHaveClass("big");
  });
});
