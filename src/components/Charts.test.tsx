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

  it("links a row to its Spotify track when it has one", () => {
    const url = "https://open.spotify.com/track/abc";
    render(<Charts entries={[{ ...entries[0], url }, entries[1]]} />);
    const link = screen.getByRole("link", { name: "Red light on Spotify" });
    expect(link).toHaveAttribute("href", url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");

    const [linked, plain] = screen.getAllByRole("listitem");
    expect(linked).not.toHaveAttribute("tabindex"); // the link is the tab stop
    expect(plain).toHaveAttribute("tabindex", "0");
    expect(within(plain).queryByRole("link")).not.toBeInTheDocument();
  });

  it("ignores links that aren't http(s)", () => {
    render(<Charts entries={[{ ...entries[0], url: "javascript:alert(1)" }]} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
