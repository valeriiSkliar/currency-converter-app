import { useUniwind } from "uniwind";

export const themeColors = {
  light: {
    bg: "#F4F2EC",
    surface: "#FFFFFF",
    surface2: "#F7F6F2",
    ink: "#0E0E10",
    ink2: "#2A2A2D",
    inkMute: "#6B7077",
    inkSoft: "#9CA0A8",
    line: "rgba(14, 14, 16, 0.07)",
    lineStrong: "rgba(14, 14, 16, 0.13)",
    accent: "#FFD200",
    accentInk: "#0E0E10",
    blue: "#0057B7",
    green: "#00C566",
    red: "#FF3B30",
    chip: "#F1EFE8",
    chipInk: "#0E0E10",
  },
  dark: {
    bg: "#0A0A0C",
    surface: "#131316",
    surface2: "#1B1B1F",
    ink: "#FAFAFA",
    ink2: "#E5E5E7",
    inkMute: "#9CA0A8",
    inkSoft: "#6B7077",
    line: "rgba(255, 255, 255, 0.07)",
    lineStrong: "rgba(255, 255, 255, 0.14)",
    accent: "#FFD200",
    accentInk: "#0E0E10",
    blue: "#5C9CFF",
    green: "#2EDB7E",
    red: "#FF6259",
    chip: "#1F1F23",
    chipInk: "#FAFAFA",
  },
} as const;

export type ThemeColors = typeof themeColors[keyof typeof themeColors];

export function useThemeColors(): ThemeColors {
  const { theme } = useUniwind();
  return theme === "dark" ? themeColors.dark : themeColors.light;
}
