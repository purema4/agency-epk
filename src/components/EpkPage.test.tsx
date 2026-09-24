import { render, screen } from "@testing-library/react";
import { ariovistus as epk } from "../mocks/fixtures";
import { ToastProvider } from "./Toast";
import EpkPage from "./EpkPage";

describe("EpkPage", () => {
  it("renders every section of the EPK", () => {
    render(
      <ToastProvider>
        <EpkPage epk={epk} />
      </ToastProvider>
    );
    expect(screen.getByRole("heading", { level: 1, name: epk.name })).toBeInTheDocument();
    expect(screen.getByText(epk.lede.split(" ")[1])).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Key numbers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "BIO" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CHARTS TOP 100" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(epk.charts.length);
    expect(screen.getByRole("button", { name: "Copy email" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveClass("booking");
    expect(screen.getAllByRole("link", { name: /spotify|beatport|soundcloud|youtube|instagram/i })).toHaveLength(
      epk.platforms.length
    );
  });
});
