/* eslint-disable react-refresh/only-export-components */
import type { VersionCheckResult } from "../services/app-update-service";
import * as React from "react";

import { checkForRequiredAppUpdate } from "../services/app-update-service";

export type AppUpdateContextType = {
  checkUpdate: () => Promise<VersionCheckResult>;
  dismissDebugUpdate: () => void;
  installedVersion: string | null;
  isChecking: boolean;
  isDebugUpdateVisible: boolean;
  isUpdateRequired: boolean;
  requiredVersion: string | null;
  showDebugUpdate: () => void;
};

const AppUpdateContext = React.createContext<AppUpdateContextType | null>(null);

export function AppUpdateProvider({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = React.useState(true);
  const [isUpdateRequired, setIsUpdateRequired] = React.useState(false);
  const [installedVersion, setInstalledVersion] = React.useState<string | null>(null);
  const [requiredVersion, setRequiredVersion] = React.useState<string | null>(null);
  const [isDebugUpdateVisible, setIsDebugUpdateVisible] = React.useState(false);

  const checkUpdate = React.useCallback(async (): Promise<VersionCheckResult> => {
    setIsChecking(true);
    try {
      const result = await checkForRequiredAppUpdate();

      if (result.status === "update-required") {
        setIsUpdateRequired(true);
        setInstalledVersion(result.installedVersion);
        setRequiredVersion(result.requiredVersion);
      }
      else if (result.status === "up-to-date") {
        setIsUpdateRequired(false);
        setInstalledVersion(result.installedVersion);
        setRequiredVersion(result.requiredVersion);
      }
      else {
        setIsUpdateRequired(false);
      }

      return result;
    }
    finally {
      setIsChecking(false);
    }
  }, []);

  React.useEffect(() => {
    void checkUpdate();
  }, [checkUpdate]);

  const showDebugUpdate = React.useCallback(() => {
    if (__DEV__) {
      setIsDebugUpdateVisible(true);
    }
  }, []);

  const dismissDebugUpdate = React.useCallback(() => {
    if (__DEV__) {
      setIsDebugUpdateVisible(false);
    }
  }, []);

  const value = React.useMemo<AppUpdateContextType>(
    () => ({
      checkUpdate,
      dismissDebugUpdate,
      installedVersion,
      isChecking,
      isDebugUpdateVisible,
      isUpdateRequired,
      requiredVersion,
      showDebugUpdate,
    }),
    [
      checkUpdate,
      dismissDebugUpdate,
      installedVersion,
      isChecking,
      isDebugUpdateVisible,
      isUpdateRequired,
      requiredVersion,
      showDebugUpdate,
    ],
  );

  return (
    <AppUpdateContext value={value}>
      {children}
    </AppUpdateContext>
  );
}

export function useAppUpdate(): AppUpdateContextType {
  const context = React.use(AppUpdateContext);
  if (!context) {
    throw new Error("useAppUpdate must be used within an AppUpdateProvider");
  }
  return context;
}
