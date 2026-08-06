import { useQuery } from "@tanstack/react-query";
import Env from "env";
import { Platform } from "react-native";
import { client } from "@/lib/api";
import { isVersionOutdated } from "../utils/version-helpers";

export type MobileVersionsResponse = {
  ios: string;
  android: string;
};

export function useVersionCheck() {
  const currentVersion = Env.EXPO_PUBLIC_VERSION || "1.0.0";
  const platform = Platform.OS === "ios" ? "ios" : "android";

  const { data, isLoading, isError, refetch } = useQuery<MobileVersionsResponse>({
    queryKey: ["mobile-versions"],
    queryFn: async () => {
      const response = await client.get<MobileVersionsResponse>("/mobile/versions");
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const minVersion = data ? data[platform] : null;
  const isUpdateRequired = minVersion ? isVersionOutdated(currentVersion, minVersion) : false;

  return {
    isUpdateRequired,
    currentVersion,
    minVersion,
    isLoading,
    isError,
    refetch,
  };
}
