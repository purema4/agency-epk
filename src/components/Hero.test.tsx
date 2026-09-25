import { fireEvent, render, screen } from "@testing-library/react";
import { setMediaQueries } from "../test/setup";
import userEvent from "@testing-library/user-event";
import { act } from "@testing-library/react";
import {
  $,
  installDeviceOrientation,
  rect,
  tiltDevice,
  uninstallDeviceOrientation,
} from "../test/utils";
import Hero from "./Hero";

const props = {
  name: "ARIOVISTUS",
  label: "BERLIN RECORDS",
  kicker: "TALENT - EPK - 2026",
  photo: { src: "/hero.jpg", alt: "DJ behind the decks" },
  tags: ["PEAK TECHNO", "DRIVEN"],
  platforms: [
    { name: "Spotify", url: "https://spotify.example" },
    { name: "Beatport", url: "#" },
  ],
};

describe("Hero", () => {
  it("renders the name, labels, photo and tags", () => {
    render(<Hero {...props} />);
    expect(screen.getByRole("heading", { level: 1, name: "ARIOVISTUS" })).toBeInTheDocument();
    expect(screen.getByText("BERLIN RECORDS")).toBeInTheDocument();
    expect(screen.getByText("TALENT - EPK - 2026")).toBeInTheDocument();
    expect(screen.getByAltText("DJ behind the decks")).toHaveAttribute("src", "/hero.jpg");
    expect(screen.getByText("PEAK TECHNO")).toHaveClass("tag");
    expect(screen.getByText("DRIVEN")).toHaveClass("tag");
  });

  it("renders the platform links", () => {
    render(<Hero {...props} />);
    const nav = screen.getByRole("navigation", { name: "Listen and follow" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spotify" })).toHaveAttribute("href", "https://spotify.example");
    expect(screen.getByRole("link", { name: "Beatport" })).toHaveAttribute("target", "_blank");
  });

  it("leaves out platform links that aren't web links", () => {
    render(<Hero {...props} platforms={[...props.platforms, { name: "Evil", url: "javascript:alert(1)" }]} />);
    expect(screen.queryByText("Evil")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("shifts the photo against the pointer and resets on leave", () => {
    const { container } = render(<Hero {...props} />);
    const hero = $(container, ".hero");
    const img = screen.getByAltText("DJ behind the decks");
    vi.spyOn(hero, "getBoundingClientRect").mockReturnValue(rect(0, 0, 100, 100));

    fireEvent.pointerMove(hero, { clientX: 100, clientY: 100 });
    expect(img.style.getPropertyValue("--px")).toBe("-9px");
    expect(img.style.getPropertyValue("--py")).toBe("-6px");

    fireEvent.pointerLeave(hero);
    expect(img.style.getPropertyValue("--px")).toBe("0px");
  });

  it("does not move the photo with reduced motion", () => {
    setMediaQueries("(prefers-reduced-motion: reduce)");
    const { container } = render(<Hero {...props} />);
    const hero = $(container, ".hero");
    vi.spyOn(hero, "getBoundingClientRect").mockReturnValue(rect(0, 0, 100, 100));
    fireEvent.pointerMove(hero, { clientX: 100, clientY: 100 });
    expect(screen.getByAltText("DJ behind the decks").style.getPropertyValue("--px")).toBe("0px");
  });

  describe("gyroscope on touch devices", () => {
    afterEach(uninstallDeviceOrientation);
    const img = () => screen.getByAltText("DJ behind the decks");

    it("moves the photo opposite to the tilt (Android, no prompt)", () => {
      setMediaQueries("(pointer: coarse)");
      installDeviceOrientation();
      render(<Hero {...props} />);
      expect(screen.queryByRole("button", { name: "Enable motion" })).not.toBeInTheDocument();

      act(() => tiltDevice(30, 0));
      act(() => tiltDevice(30, 40)); // far right: clamped to a full swing
      expect(img().style.getPropertyValue("--px")).toBe("-12px");
    });

    it("asks for permission on iOS before moving", async () => {
      const user = userEvent.setup();
      setMediaQueries("(pointer: coarse)");
      const { requestPermission } = installDeviceOrientation("granted");
      render(<Hero {...props} />);

      act(() => tiltDevice(30, 40));
      expect(img().style.getPropertyValue("--px")).toBe("0px");

      await user.click(screen.getByRole("button", { name: "Enable motion" }));
      expect(requestPermission).toHaveBeenCalledOnce();
      expect(screen.queryByRole("button", { name: "Enable motion" })).not.toBeInTheDocument();

      act(() => tiltDevice(30, 0));
      act(() => tiltDevice(30, 40));
      expect(img().style.getPropertyValue("--px")).toBe("-12px");
    });

    it("stays still and hides the prompt with reduced motion", () => {
      setMediaQueries("(pointer: coarse)", "(prefers-reduced-motion: reduce)");
      installDeviceOrientation("granted");
      render(<Hero {...props} />);
      expect(screen.queryByRole("button", { name: "Enable motion" })).not.toBeInTheDocument();
    });

    it("is off on desktop", () => {
      installDeviceOrientation();
      render(<Hero {...props} />);
      act(() => tiltDevice(30, 0));
      act(() => tiltDevice(30, 40));
      expect(img().style.getPropertyValue("--px")).toBe("0px");
    });
  });
});
