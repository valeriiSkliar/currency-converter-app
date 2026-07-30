import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_900Black, useFonts } from "@expo-google-fonts/inter";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as React from "react";
import { StyleSheet } from "react-native";
import FlashMessage from "react-native-flash-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useThemeConfig } from "@/components/ui/use-theme-config";
import {
  AppUpdateProvider,
  AppUpdateScreen,
  useAppUpdate,
} from "@/features/app-update";
import { PrivacyModal } from "@/features/converter/components/privacy-modal";
import { useSettingsStore } from "@/features/settings/store/use-settings-store";
import { APIProvider } from "@/lib/api";
import { loadSelectedTheme } from "@/lib/hooks/use-selected-theme";
// Import global CSS file
import "../global.css";

export { ErrorBoundary } from "expo-router";

// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  initialRouteName: "(app)",
};

loadSelectedTheme();
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  const privacyAccepted = useSettingsStore(state => state.privacyAccepted);
  const setPrivacyAccepted = useSettingsStore(state => state.setPrivacyAccepted);

  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Providers>
      <MainContent
        privacyAccepted={privacyAccepted}
        onAcceptPrivacy={() => setPrivacyAccepted(true)}
      />
    </Providers>
  );
}

function MainContent({
  privacyAccepted,
  onAcceptPrivacy,
}: {
  onAcceptPrivacy: () => void;
  privacyAccepted: boolean;
}) {
  const { isChecking, isUpdateRequired, isDebugUpdateVisible } = useAppUpdate();

  if (isChecking) {
    return null;
  }

  if (isUpdateRequired || isDebugUpdateVisible) {
    return <AppUpdateScreen />;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
      <PrivacyModal
        visible={!privacyAccepted}
        onAccept={onAcceptPrivacy}
      />
    </>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView
      style={styles.container}
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <SafeAreaProvider>
          <ThemeProvider value={theme}>
            <APIProvider>
              <AppUpdateProvider>
                <BottomSheetModalProvider>
                  {children}
                  <FlashMessage position="top" />
                </BottomSheetModalProvider>
              </AppUpdateProvider>
            </APIProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
