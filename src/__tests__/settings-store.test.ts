import { useSettingsStore } from "@/features/settings/store/use-settings-store";

beforeEach(() => {
  useSettingsStore.setState({
    theme: "system",
    language: "en",
    decimalPlaces: 2,
    wallpaper: "default",
    privacyAccepted: false,
  });
});

describe("useSettingsStore", () => {
  it("has default state values", () => {
    const state = useSettingsStore.getState();
    expect(state.theme).toBe("system");
    expect(state.language).toBe("en");
    expect(state.decimalPlaces).toBe(2);
    expect(state.wallpaper).toBe("default");
    expect(state.privacyAccepted).toBe(false);
  });

  it("updates theme", () => {
    useSettingsStore.getState().setTheme("dark");
    expect(useSettingsStore.getState().theme).toBe("dark");

    useSettingsStore.getState().setTheme("light");
    expect(useSettingsStore.getState().theme).toBe("light");
  });

  it("updates language", () => {
    useSettingsStore.getState().setLanguage("ru");
    expect(useSettingsStore.getState().language).toBe("ru");
  });

  it("updates decimal places", () => {
    useSettingsStore.getState().setDecimalPlaces(5);
    expect(useSettingsStore.getState().decimalPlaces).toBe(5);
  });

  it("updates wallpaper", () => {
    useSettingsStore.getState().setWallpaper("forest_sunset");
    expect(useSettingsStore.getState().wallpaper).toBe("forest_sunset");
  });

  it("updates privacy accepted status", () => {
    useSettingsStore.getState().setPrivacyAccepted(true);
    expect(useSettingsStore.getState().privacyAccepted).toBe(true);
  });
});
