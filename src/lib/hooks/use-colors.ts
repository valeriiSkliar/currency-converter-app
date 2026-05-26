import { useUniwind } from "uniwind";

export function useColors() {
  const { theme } = useUniwind();
  const isDark = theme === "dark";

  return {
    accent: "#FFD200",
    accentInk: "#0E0E10",
    bg: isDark ? "#0A0A0C" : "#F4F2EC",
    blue: isDark ? "#5C9CFF" : "#0057B7",
    green: isDark ? "#2EDB7E" : "#00C566",
    ink: isDark ? "#FAFAFA" : "#0E0E10",
    ink2: isDark ? "#E5E5E7" : "#2A2A2D",
    inkMute: isDark ? "#9CA0A8" : "#6B7077",
    inkSoft: isDark ? "#6B7077" : "#9CA0A8",
    isDark,
    line: isDark ? "rgba(255,255,255,0.07)" : "rgba(14,14,16,0.07)",
    lineStrong: isDark ? "rgba(255,255,255,0.14)" : "rgba(14,14,16,0.13)",
    red: isDark ? "#FF6259" : "#FF3B30",
    surface: isDark ? "#131316" : "#FFFFFF",
    surface2: isDark ? "#1B1B1F" : "#F7F6F2",
  };
}
