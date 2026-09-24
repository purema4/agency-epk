import { act, render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "./Toast";

function Trigger({ msg }: { msg: string }) {
  const toast = useToast();
  return <button onClick={() => toast(msg)}>go</button>;
}

describe("Toast", () => {
  it("shows a message and hides it after the duration", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider duration={1000}>
        <Trigger msg="Hello" />
      </ToastProvider>
    );
    const status = screen.getByRole("status");
    expect(status).not.toHaveClass("show");

    act(() => screen.getByRole("button").click());
    expect(status).toHaveTextContent("Hello");
    expect(status).toHaveClass("show");

    act(() => vi.advanceTimersByTime(999));
    expect(status).toHaveClass("show");
    act(() => vi.advanceTimersByTime(1));
    expect(status).not.toHaveClass("show");
  });
});
