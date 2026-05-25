import { Slot, useRouter } from "expo-router";
import * as React from "react";
import { Linking, Pressable, Share, StyleSheet, View } from "react-native";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { DrawerMenu } from "@/components/drawer-menu";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";
import { useSettingsStore } from "@/features/settings/store/use-settings-store";
import { DrawerContext } from "@/lib/drawer-context";

const DRAWER_WIDTH = 280;

export default function AppLayout() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const isPro = useQuotaStore(state => state.isPro);
  const setPrivacyAccepted = useSettingsStore(state => state.setPrivacyAccepted);

  const translateX = useSharedValue(-DRAWER_WIDTH);

  const openDrawer = () => {
    setIsDrawerOpen(true);
    translateX.value = withTiming(0, { duration: 250 });
  };

  const closeDrawer = () => {
    translateX.value = withTiming(-DRAWER_WIDTH, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(setIsDrawerOpen)(false);
      }
    });
  };

  const handleNavigate = (route: string) => {
    closeDrawer();
    // Wrap navigation in microtask to allow drawer close transition to start
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  const handleRemoveAds = () => {
    closeDrawer();
    setTimeout(() => {
      router.push("/paywall");
    }, 100);
  };

  const handleShare = async () => {
    closeDrawer();
    try {
      await Share.share({
        message: "Check out this amazing Currency Converter app! Download now at https://currencyconverterapp.com",
      });
    }
    catch {
      // Ignored
    }
  };

  const handleRate = () => {
    closeDrawer();
    const url = "https://apps.apple.com/app/currency-converter";
    Linking.openURL(url).catch(() => {});
  };

  const handleOpenPrivacy = () => {
    closeDrawer();
    // Temporarily setting privacyAccepted to false forces the RootLayout overlay to appear
    setTimeout(() => {
      setPrivacyAccepted(false);
    }, 200);
  };

  const overlayStyle = useAnimatedStyle(() => {
    const opacity = ((translateX.value + DRAWER_WIDTH) / DRAWER_WIDTH) * 0.5;
    return {
      opacity,
    };
  });

  const drawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <DrawerContext value={{ openDrawer, closeDrawer, isDrawerOpen }}>
      <View style={styles.container}>
        {/* Active Route Slot */}
        <Slot />

        {/* Custom Slide drawer overlay */}
        {isDrawerOpen && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Dim Backdrop overlay */}
            <Animated.View style={[styles.overlay, overlayStyle]}>
              <Pressable style={styles.pressable} onPress={closeDrawer} />
            </Animated.View>

            {/* Sliding menu panel */}
            <Animated.View style={[styles.drawerPanel, drawerStyle]}>
              <DrawerMenu
                isPro={isPro}
                onNavigate={handleNavigate}
                onRemoveAds={handleRemoveAds}
                onShare={handleShare}
                onRate={handleRate}
                onOpenPrivacy={handleOpenPrivacy}
              />
            </Animated.View>
          </View>
        )}
      </View>
    </DrawerContext>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  pressable: {
    flex: 1,
  },
  drawerPanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
});
