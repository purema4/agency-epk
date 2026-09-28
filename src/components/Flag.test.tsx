import { fireEvent, render, screen } from "@testing-library/react";
import Flag, { countryName } from "./Flag";

describe("Flag", () => {
  it("names countries from their ISO code", () => {
    expect(countryName("CA")).toBe("Canada");
    expect(countryName("gb")).toBe("United Kingdom");
  });

  it.each([undefined, "", "CAN", "C1", "../x"])("shows nothing for %j", (code) => {
    const { container } = render(<Flag country={code} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides itself when the flag image can't load", () => {
    const { container } = render(<Flag country="FR" />);
    fireEvent.error(screen.getByRole("img", { name: "France" }));
    expect(container).toBeEmptyDOMElement();
  });
});
