describe("aPI client", () => {
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

  it("has correct baseURL from env", () => {
    const { client } = require("../lib/api/client");
    expect(client.defaults.baseURL).toBe("http://localhost:8088");
  });

  it("has X-App-Key auth header", () => {
    const { client } = require("../lib/api/client");
    const headers = client.defaults.headers as Record<string, unknown>;
    expect(headers["X-App-Key"]).toBe("test-service-key");
  });

  it("has 10s timeout", () => {
    const { client } = require("../lib/api/client");
    expect(client.defaults.timeout).toBe(10_000);
  });
});
