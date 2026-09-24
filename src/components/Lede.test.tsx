import { render } from "@testing-library/react";
import { $ } from "../test/utils";
import Lede from "./Lede";

describe("Lede", () => {
  it("wraps each word in a span and keeps the text intact", () => {
    const text = "Freedom over  comfort.";
    const { container } = render(<Lede text={text} />);
    const p = $(container, "p.lede");
    expect(p.textContent).toBe(text);
    expect([...p.querySelectorAll(".w")].map((s) => s.textContent)).toEqual(["Freedom", "over", "comfort."]);
  });
});
