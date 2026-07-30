import { Platform } from "react-native";
import {
  checkForRequiredAppUpdate,
  compareVersions,
  getInstalledAppVersion,
} from "../services/app-update-service";

describe("appUpdateService - compareVersions", () => {
  it("returns 0 for equal versions", () => {
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("1.2.3", "1.2.3")).toBe(0);
  });

  it("returns -1 when installed is lower than required", () => {
    expect(compareVersions("1.0.9", "1.0.10")).toBe(-1);
    expect(compareVersions("1.0.64", "1.0.65")).toBe(-1);
    expect(compareVersions("1.9.99", "2.0.0")).toBe(-1);
    expect(compareVersions("0.9.9", "1.0.0")).toBe(-1);
  });

  it("returns 1 when installed is higher than required", () => {
    expect(compareVersions("1.0.10", "1.0.9")).toBe(1);
    expect(compareVersions("1.1.0", "1.0.65")).toBe(1);
    expect(compareVersions("2.0.0", "1.99.99")).toBe(1);
  });

  it("returns 0 for invalid version format string", () => {
    expect(compareVersions("1.0", "1.0.0")).toBe(0);
    expect(compareVersions("invalid", "1.0.0")).toBe(0);
    expect(compareVersions("1.0.0", "1.0.0-beta")).toBe(0);
  });
});

describe("appUpdateService - getInstalledAppVersion", () => {
  it("returns a valid SemVer string", () => {
    const version = getInstalledAppVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("appUpdateService - checkForRequiredAppUpdate", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.defineProperty(Platform, "OS", { get: () => "ios", configurable: true });
  });

  it("skips version check on Web platform", async () => {
    Object.defineProperty(Platform, "OS", { get: () => "web", configurable: true });
    const result = await checkForRequiredAppUpdate();
    expect(result).toEqual({ reason: "web_platform", status: "skipped" });
  });

  it("returns update-required when backend version is higher than installed", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ android: "99.0.0", ios: "99.0.0" }),
      ok: true,
      status: 200,
    });

    const result = await checkForRequiredAppUpdate();
    expect(result.status).toBe("update-required");
    if (result.status === "update-required") {
      expect(result.requiredVersion).toBe("99.0.0");
    }
  });

  it("returns up-to-date when installed version is equal or higher", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ android: "1.0.0", ios: "1.0.0" }),
      ok: true,
      status: 200,
    });

    const result = await checkForRequiredAppUpdate();
    expect(result.status).toBe("up-to-date");
  });

  it("returns skipped on 401 Unauthorized without throwing or logging error details", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    const result = await checkForRequiredAppUpdate();
    expect(result).toEqual({ reason: "http_401", status: "skipped" });
  });

  it("returns skipped on network failure", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError("Network error"));

    const result = await checkForRequiredAppUpdate();
    expect(result).toEqual({ reason: "network_or_parse_error", status: "skipped" });
  });

  it("returns skipped on timeout (AbortError)", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    globalThis.fetch = jest.fn().mockRejectedValue(abortError);

    const result = await checkForRequiredAppUpdate();
    expect(result).toEqual({ reason: "timeout", status: "skipped" });
  });

  it("returns skipped if response format is invalid", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ invalid: "data" }),
      ok: true,
      status: 200,
    });

    const result = await checkForRequiredAppUpdate();
    expect(result).toEqual({ reason: "invalid_response_format", status: "skipped" });
  });
});
