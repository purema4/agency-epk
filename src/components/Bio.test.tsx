import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { $ } from "../test/utils";
import Bio from "./Bio";

describe("Bio", () => {
  it("expands and collapses the full bio", async () => {
    const user = userEvent.setup();
    const { container } = render(<Bio short="Short bio." extra="Long bio." />);
    const button = screen.getByRole("button", { name: "Read full bio" });
    const extra = $(container, ".bio-extra");

    expect(screen.getByText("Short bio.")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", extra.id);
    expect(extra).not.toHaveClass("open");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveTextContent("Show less");
    expect(extra).toHaveClass("open");

    await user.click(button);
    expect(button).toHaveTextContent("Read full bio");
    expect(extra).not.toHaveClass("open");
  });

  it("hides the toggle when there is no extra text", () => {
    render(<Bio short="Short bio." />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
