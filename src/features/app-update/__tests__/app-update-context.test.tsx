import { act, renderHook } from "@testing-library/react-native";
import * as React from "react";

import { AppUpdateProvider, useAppUpdate } from "../context/app-update-context";
import * as appUpdateService from "../services/app-update-service";

jest.mock("../services/app-update-service");

describe("appUpdateContext", () => {
  const mockCheckForRequiredAppUpdate = appUpdateService.checkForRequiredAppUpdate as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppUpdateProvider>{children}</AppUpdateProvider>
  );

  it("throws an error if useAppUpdate is used outside of AppUpdateProvider", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAppUpdate())).toThrow(
      "useAppUpdate must be used within an AppUpdateProvider",
    );
    consoleErrorSpy.mockRestore();
  });

  it("initializes and performs update check", async () => {
    mockCheckForRequiredAppUpdate.mockResolvedValue({
      installedVersion: "1.0.0",
      requiredVersion: "2.0.0",
      status: "update-required",
    });

    const { result } = renderHook(() => useAppUpdate(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isChecking).toBe(false);
    expect(result.current.isUpdateRequired).toBe(true);
    expect(result.current.installedVersion).toBe("1.0.0");
    expect(result.current.requiredVersion).toBe("2.0.0");
  });

  it("handles up-to-date status", async () => {
    mockCheckForRequiredAppUpdate.mockResolvedValue({
      installedVersion: "2.0.0",
      requiredVersion: "2.0.0",
      status: "up-to-date",
    });

    const { result } = renderHook(() => useAppUpdate(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isChecking).toBe(false);
    expect(result.current.isUpdateRequired).toBe(false);
  });

  it("allows toggling debug update screen in DEV mode", async () => {
    mockCheckForRequiredAppUpdate.mockResolvedValue({
      reason: "skipped",
      status: "skipped",
    });

    const { result } = renderHook(() => useAppUpdate(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isDebugUpdateVisible).toBe(false);

    act(() => {
      result.current.showDebugUpdate();
    });

    expect(result.current.isDebugUpdateVisible).toBe(true);

    act(() => {
      result.current.dismissDebugUpdate();
    });

    expect(result.current.isDebugUpdateVisible).toBe(false);
  });
});
