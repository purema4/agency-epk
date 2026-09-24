import { render, screen, within } from "@testing-library/react";
import Charts from "./Charts";

const entries = [
  { title: "Red light", label: "Replicate", position: "12TH" },
  { title: "I LOVE YOU", label: "Animarum", position: "40TH" },
];

describe("Charts", () => {
  it("renders a focusable row per entry", () => {
    render(<Charts entries={entries} />);
    expect(screen.getByRole("heading", { name: "CHARTS TOP 100" })).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);

    const first = within(rows[0]);
    expect(first.getByText("Red light")).toBeInTheDocument();
    expect(first.getByText("Replicate")).toBeInTheDocument();
    expect(first.getByText("12TH")).toHaveClass("pos");
    expect(rows[0]).toHaveAttribute("tabindex", "0");
    expect(rows[0].querySelector(".eq")).toHaveAttribute("aria-hidden", "true");
  });
});
