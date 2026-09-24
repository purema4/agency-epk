import { act, renderHook } from "@testing-library/react";
import { installDeviceOrientation, tiltDevice, uninstallDeviceOrientation } from "../test/utils";
import { useDeviceTilt } from "./useDeviceTilt";

afterEach(uninstallDeviceOrientation);

describe("useDeviceTilt", () => {
  it("reports unsupported when the browser has no orientation API", () => {
    Object.defineProperty(window, "DeviceOrientationEvent", { configurable: true, value: undefined });
    const { result } = renderHook(() => useDeviceTilt(vi.fn(), true));
    expect(result.current.permission).toBe("unsupported");
  });

  it("tracks tilt relative to the starting angle without asking (Android)", () => {
    installDeviceOrientation();
    const onTilt = vi.fn();
    const { result } = renderHook(() => useDeviceTilt(onTilt, true));
    expect(result.current.permission).toBe("granted");

    act(() => tiltDevice(45, 5)); // phone held at 45°: this becomes neutral
    expect(onTilt).toHaveBeenLastCalledWith(0, 0);

    act(() => tiltDevice(45, 15)); // tilt 10° right
    const [x, y] = onTilt.mock.lastCall!;
    expect(x).toBeCloseTo(0.495, 2); // 10° of a 20° range, minus a little re-centring
    expect(y).toBeCloseTo(0);

    act(() => tiltDevice(-90, 90)); // way past the range: clamped
    expect(onTilt.mock.lastCall![0]).toBe(1);
    expect(onTilt.mock.lastCall![1]).toBe(-1);
  });

  it("ignores events with no sensor data", () => {
    installDeviceOrientation();
    const onTilt = vi.fn();
    renderHook(() => useDeviceTilt(onTilt, true));
    act(() => tiltDevice(null, null));
    expect(onTilt).not.toHaveBeenCalled();
  });

  it("does not listen while disabled", () => {
    installDeviceOrientation();
    const onTilt = vi.fn();
    renderHook(() => useDeviceTilt(onTilt, false));
    act(() => tiltDevice(10, 10));
    expect(onTilt).not.toHaveBeenCalled();
  });

  it("waits for permission on iOS, then listens once granted", async () => {
    const { requestPermission } = installDeviceOrientation("granted");
    const onTilt = vi.fn();
    const { result } = renderHook(() => useDeviceTilt(onTilt, true));
    expect(result.current.permission).toBe("prompt");

    act(() => tiltDevice(10, 10));
    expect(onTilt).not.toHaveBeenCalled();

    await act(() => result.current.request());
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(result.current.permission).toBe("granted");

    act(() => tiltDevice(10, 10));
    expect(onTilt).toHaveBeenCalled();
  });

  it.each([
    ["the user declines", "denied" as const],
    ["the prompt throws", new Error("not a user gesture")],
  ])("stays off when %s on iOS", async (_, answer) => {
    installDeviceOrientation(answer);
    const onTilt = vi.fn();
    const { result } = renderHook(() => useDeviceTilt(onTilt, true));

    await act(() => result.current.request());
    expect(result.current.permission).toBe("denied");
    act(() => tiltDevice(10, 10));
    expect(onTilt).not.toHaveBeenCalled();
  });
});
