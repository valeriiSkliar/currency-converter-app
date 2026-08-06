import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import * as React from "react";
import { client } from "@/lib/api";
import { useVersionCheck } from "../use-version-check";

jest.mock("@/lib/api", () => ({
  client: {
    get: jest.fn(),
  },
}));

describe("useVersionCheck", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("returns isUpdateRequired = false when app version meets minimum required version", async () => {
    (client.get as jest.Mock).mockResolvedValueOnce({
      data: { ios: "1.0.0", android: "1.0.0" },
    });

    const { result } = renderHook(() => useVersionCheck(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isUpdateRequired).toBe(false);
    expect(result.current.minVersion).toBe("1.0.0");
  });

  it("returns isUpdateRequired = true when app version is lower than minimum required version", async () => {
    (client.get as jest.Mock).mockResolvedValueOnce({
      data: { ios: "2.5.0", android: "2.5.0" },
    });

    const { result } = renderHook(() => useVersionCheck(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isUpdateRequired).toBe(true);
    expect(result.current.minVersion).toBe("2.5.0");
  });
});
