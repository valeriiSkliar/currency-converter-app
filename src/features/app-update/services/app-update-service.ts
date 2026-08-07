import Env from "env";
import Constants from "expo-constants";

import { Platform } from "react-native";

const VERSION_REGEX = /^\d+\.\d+\.\d+$/;
const FETCH_TIMEOUT_MS = 5000;

export type VersionCheckResult
  = | {
    installedVersion: string;
    requiredVersion: string;
    status: "up-to-date";
  }
  | {
    installedVersion: string;
    requiredVersion: string;
    status: "update-required";
  }
  | {
    reason: string;
    status: "skipped";
  };

export function compareVersions(installed: string, required: string): -1 | 0 | 1 {
  if (!VERSION_REGEX.test(installed) || !VERSION_REGEX.test(required)) {
    return 0;
  }

  const installedParts = installed.split(".").map(Number);
  const requiredParts = required.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const inst = installedParts[i] ?? 0;
    const req = requiredParts[i] ?? 0;

    if (inst < req) {
      return -1;
    }
    if (inst > req) {
      return 1;
    }
  }

  return 0;
}

export function getInstalledAppVersion(): string {
  const version = Constants.expoConfig?.version
    ?? Constants.nativeAppVersion
    ?? Env.EXPO_PUBLIC_VERSION
    ?? "1.0.0";

  return VERSION_REGEX.test(version) ? version : "1.0.0";
}

export async function checkForRequiredAppUpdate(): Promise<VersionCheckResult> {
  if (Platform.OS === "web") {
    return { reason: "web_platform", status: "skipped" };
  }

  const installedVersion = getInstalledAppVersion();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const baseUrl = Env.EXPO_PUBLIC_API_URL.replace(/\/+$/, "");
    const endpoint = `${baseUrl}/api/mobile/versions`;

    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { reason: `http_${response.status}`, status: "skipped" };
    }

    const data = (await response.json()) as { android?: string; ios?: string };

    const requiredVersion = Platform.OS === "ios" ? data.ios : data.android;

    if (!requiredVersion || typeof requiredVersion !== "string" || !VERSION_REGEX.test(requiredVersion)) {
      return { reason: "invalid_response_format", status: "skipped" };
    }

    const comparison = compareVersions(installedVersion, requiredVersion);

    if (comparison < 0) {
      return {
        installedVersion,
        requiredVersion,
        status: "update-required",
      };
    }

    return {
      installedVersion,
      requiredVersion,
      status: "up-to-date",
    };
  }
  catch (error) {
    clearTimeout(timeoutId);
    const reason = error instanceof Error && error.name === "AbortError" ? "timeout" : "network_or_parse_error";
    return { reason, status: "skipped" };
  }
}
