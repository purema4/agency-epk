import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithToast } from "../test/utils";
import Booking from "./Booking";

const props = {
  email: "bookings@berlinrecords.world",
  agencyUrl: "https://berlinrecords.info/agency",
  agencyLabel: "BERLINRECORDS.INFO/AGENCY",
};

describe("Booking", () => {
  it("renders only the bookings email and agency link when there is no contact name", () => {
    const { container } = renderWithToast(<Booking {...props} />);
    expect(container.querySelector(".booking > div")?.firstElementChild?.tagName).toBe("A");
    expect(screen.getByRole("link", { name: "BOOKINGS@BERLINRECORDS.WORLD" })).toHaveAttribute(
      "href",
      "mailto:bookings@berlinrecords.world"
    );
    expect(screen.getByRole("link", { name: "BERLINRECORDS.INFO/AGENCY" })).toHaveAttribute(
      "href",
      "https://berlinrecords.info/agency"
    );
  });

  it("doesn't link an address carrying mailto: parameters or an agency URL that isn't a web link", () => {
    renderWithToast(<Booking {...props} email="a@b.com?bcc=x@evil.com" agencyUrl="javascript:alert(1)" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("A@B.COM?BCC=X@EVIL.COM")).toBeInTheDocument();
    expect(screen.getByText("BERLINRECORDS.INFO/AGENCY")).toBeInTheDocument();
  });

  it("shows a contact name line when the CRM provides one", () => {
    renderWithToast(<Booking {...props} contact="BOOKING - JANE DOE" />);
    expect(screen.getByText("BOOKING - JANE DOE")).toBeInTheDocument();
  });

  it("copies the email and confirms with a toast", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderWithToast(<Booking {...props} />);

    await user.click(screen.getByRole("button", { name: "Copy email" }));
    expect(writeText).toHaveBeenCalledWith("bookings@berlinrecords.world");
    expect(screen.getByRole("status")).toHaveTextContent("Email copied");
    expect(screen.getByRole("status")).toHaveClass("show");
  });

  it("selects the address when the clipboard is blocked", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    renderWithToast(<Booking {...props} />);

    await user.click(screen.getByRole("button", { name: "Copy email" }));
    expect(screen.getByRole("status")).toHaveTextContent("Email selected, press Ctrl+C to copy");
    expect(window.getSelection()?.toString()).toBe("BOOKINGS@BERLINRECORDS.WORLD");
  });
});
