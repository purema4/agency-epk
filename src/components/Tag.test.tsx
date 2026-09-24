import { fireEvent, render, screen } from "@testing-library/react";
import { setMediaQueries } from "../test/setup";
import { rect as makeRect } from "../test/utils";
import Tag from "./Tag";

const rect = makeRect(0, 0, 100, 40);

describe("Tag", () => {
  it("follows the pointer and snaps back on leave", () => {
    render(<Tag>MELODIC</Tag>);
    const tag = screen.getByText("MELODIC");
    vi.spyOn(tag, "getBoundingClientRect").mockReturnValue(rect);

    fireEvent.pointerMove(tag, { clientX: 100, clientY: 40 });
    expect(tag.style.getPropertyValue("--tx")).toBe("9px");
    expect(tag.style.getPropertyValue("--ty")).toBe("6px");

    fireEvent.pointerLeave(tag);
    expect(tag.style.getPropertyValue("--tx")).toBe("0px");
    expect(tag.style.getPropertyValue("--ty")).toBe("0px");
  });

  it("stays put with reduced motion", () => {
    setMediaQueries("(prefers-reduced-motion: reduce)");
    render(<Tag>MELODIC</Tag>);
    const tag = screen.getByText("MELODIC");
    vi.spyOn(tag, "getBoundingClientRect").mockReturnValue(rect);
    fireEvent.pointerMove(tag, { clientX: 100, clientY: 40 });
    expect(tag.style.getPropertyValue("--tx")).toBe("0px");
  });
});
