describe("env", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      EXPO_PUBLIC_APP_ENV: "development",
      EXPO_PUBLIC_API_URL: "http://localhost:8088",
      EXPO_PUBLIC_APP_SERVICE_KEY: "test-service-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("exposes EXPO_PUBLIC_API_URL", () => {
    const Env = require("../../env").default;
    expect(Env.EXPO_PUBLIC_API_URL).toBe("http://localhost:8088");
  });

  it("exposes EXPO_PUBLIC_APP_SERVICE_KEY", () => {
    const Env = require("../../env").default;
    expect(Env.EXPO_PUBLIC_APP_SERVICE_KEY).toBe("test-service-key");
  });

  it("has CurrencyConverter as app name", () => {
    const Env = require("../../env").default;
    expect(Env.EXPO_PUBLIC_NAME).toBe("CurrencyConverter");
  });

  it("has cimmetria bundle IDs", () => {
    const Env = require("../../env").default;
    expect(Env.EXPO_PUBLIC_BUNDLE_ID).toContain("cimmetria");
  });
});
