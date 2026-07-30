import { act, fireEvent, render, screen } from "@testing-library/react-native";
import * as React from "react";
import { Linking, Platform } from "react-native";

import { AppUpdateScreen } from "../components/app-update-screen";
import { useAppUpdate } from "../context/app-update-context";

jest.mock("../context/app-update-context");

describe("appUpdateScreen", () => {
  const mockDismissDebugUpdate = jest.fn();
  const mockUseAppUpdate = useAppUpdate as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppUpdate.mockReturnValue({
      dismissDebugUpdate: mockDismissDebugUpdate,
      installedVersion: "1.0.0",
      requiredVersion: "1.2.0",
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { get: () => "ios", configurable: true });
  });

  it("renders update title, message, version labels, and update button", () => {
    render(<AppUpdateScreen />);

    expect(screen.getByText("Update Required")).toBeTruthy();
    expect(screen.getByText("Installed version: 1.0.0")).toBeTruthy();
    expect(screen.getByText("Required version: 1.2.0")).toBeTruthy();
    expect(screen.getByText("Update App")).toBeTruthy();
  });

  it("opens store URL on iOS when Update App button is pressed", async () => {
    Object.defineProperty(Platform, "OS", { get: () => "ios", configurable: true });
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

    render(<AppUpdateScreen />);
    const updateButton = screen.getByText("Update App");

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.press(updateButton);
    });

    expect(openURLSpy).toHaveBeenCalledWith("https://apps.apple.com/app/currency-converter");
  });

  it("opens market URL on Android when supported", async () => {
    Object.defineProperty(Platform, "OS", { get: () => "android", configurable: true });
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

    render(<AppUpdateScreen />);
    const updateButton = screen.getByText("Update App");

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.press(updateButton);
    });

    expect(openURLSpy).toHaveBeenCalledWith("market://details?id=com.cimmetria.currencyconverter.development");
  });

  it("calls dismissDebugUpdate when close test screen button is pressed in DEV", () => {
    render(<AppUpdateScreen />);
    const closeButton = screen.getByText("Close test screen (DEV)");

    fireEvent.press(closeButton);

    expect(mockDismissDebugUpdate).toHaveBeenCalledTimes(1);
  });
});
