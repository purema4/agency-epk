import { act, render, screen } from "@testing-library/react";
import { RAF_TIMERS } from "../test/utils";
import { setMediaQueries, triggerIntersection } from "../test/setup";
import Stats from "./Stats";

const stats = [
  { value: "8K", label: "Spotify monthly listeners" },
  { value: "9,7K", label: "Instagram followers" },
  { value: "XX", label: "Placeholder" },
];

const valueOf = (label: string) => screen.getByText(label).previousElementSibling as HTMLElement;

describe("Stats", () => {
  it("renders every stat with its label", () => {
    render(<Stats stats={stats} />);
    expect(screen.getByRole("region", { name: "Key numbers" })).toBeInTheDocument();
    expect(valueOf("Spotify monthly listeners")).toHaveTextContent("8K");
    expect(valueOf("Instagram followers")).toHaveTextContent("9,7K");
  });

  it("dims placeholder values", () => {
    render(<Stats stats={stats} />);
    expect(screen.getByText("Placeholder").closest(".stat")).toHaveClass("placeholder");
    expect(screen.getByText("Instagram followers").closest(".stat")).not.toHaveClass("placeholder");
  });

  it("counts up from zero when scrolled into view, then lands on the real value", () => {
    vi.useFakeTimers(RAF_TIMERS);
    render(<Stats stats={stats} />);

    act(() => triggerIntersection(true));
    act(() => vi.advanceTimersByTime(20));
    expect(valueOf("Instagram followers").textContent).toMatch(/^\d,\dK$/);
    expect(valueOf("Instagram followers")).not.toHaveTextContent("9,7K");
    expect(valueOf("Placeholder")).toHaveTextContent("XX");

    act(() => vi.advanceTimersByTime(1500));
    expect(valueOf("Spotify monthly listeners")).toHaveTextContent("8K");
    expect(valueOf("Instagram followers")).toHaveTextContent("9,7K");
  });

  it("shows final values immediately with reduced motion", () => {
    vi.useFakeTimers(RAF_TIMERS);
    setMediaQueries("(prefers-reduced-motion: reduce)");
    render(<Stats stats={stats} />);
    act(() => triggerIntersection(true));
    act(() => vi.advanceTimersByTime(20));
    expect(valueOf("Instagram followers")).toHaveTextContent("9,7K");
  });
});
