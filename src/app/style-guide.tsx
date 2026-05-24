import { useRouter } from "expo-router";
import * as React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import {
  ArrowRight,
  CaretDown,
  Feed,
  Github,
  Home,
  Language,
  Rate,
  Settings,
  Share,
  Style,
  Support,
  Website,
} from "@/components/ui/icons";
import { useSelectedTheme } from "@/lib/hooks/use-selected-theme";

type ColorToken = {
  name: string;
  bgClass: string;
  textClass: string;
  hexLight: string;
  hexDark: string;
  description: string;
};

const COLOR_TOKENS: ColorToken[] = [
  {
    name: "Background (bg)",
    bgClass: "bg-bg",
    textClass: "text-ink",
    hexLight: "#F4F2EC",
    hexDark: "#0A0A0C",
    description: "Main screen background color.",
  },
  {
    name: "Surface",
    bgClass: "bg-surface",
    textClass: "text-ink",
    hexLight: "#FFFFFF",
    hexDark: "#131316",
    description: "Primary cards and containers surface.",
  },
  {
    name: "Surface 2",
    bgClass: "bg-surface-2",
    textClass: "text-ink",
    hexLight: "#F7F6F2",
    hexDark: "#1B1B1F",
    description: "Secondary card backgrounds, selectors, settings items.",
  },
  {
    name: "Ink (Primary text)",
    bgClass: "bg-ink",
    textClass: "text-surface",
    hexLight: "#0E0E10",
    hexDark: "#FAFAFA",
    description: "Main body text and primary dark fills.",
  },
  {
    name: "Ink 2 (Secondary text)",
    bgClass: "bg-ink-2",
    textClass: "text-surface",
    hexLight: "#2A2A2D",
    hexDark: "#E5E5E7",
    description: "Secondary emphasis headings/subheadings.",
  },
  {
    name: "Ink Mute (Muted text)",
    bgClass: "bg-ink-mute",
    textClass: "text-surface",
    hexLight: "#6B7077",
    hexDark: "#9CA0A8",
    description: "Placeholder labels and subtitle captions.",
  },
  {
    name: "Ink Soft (Disabled text)",
    bgClass: "bg-ink-soft",
    textClass: "text-surface",
    hexLight: "#9CA0A8",
    hexDark: "#6B7077",
    description: "Extremely muted text and icons.",
  },
  {
    name: "Accent (Brand Yellow)",
    bgClass: "bg-accent",
    textClass: "text-accent-ink",
    hexLight: "#FFD200",
    hexDark: "#FFD200",
    description: "Primary action keys, selection highlights, premium badges.",
  },
  {
    name: "Chip",
    bgClass: "bg-chip",
    textClass: "text-chip-ink",
    hexLight: "#F1EFE8",
    hexDark: "#1F1F23",
    description: "Currency selection pill background.",
  },
  {
    name: "Blue",
    bgClass: "bg-blue",
    textClass: "text-white",
    hexLight: "#0057B7",
    hexDark: "#5C9CFF",
    description: "Information banners and blue accents.",
  },
  {
    name: "Green (Success)",
    bgClass: "bg-green",
    textClass: "text-white",
    hexLight: "#00C566",
    hexDark: "#2EDB7E",
    description: "Increase indicator status and active checks.",
  },
  {
    name: "Red (Danger/Errors)",
    bgClass: "bg-red",
    textClass: "text-white",
    hexLight: "#FF3B30",
    hexDark: "#FF6259",
    description: "Auth errors, delete actions, blocked state tags.",
  },
];

type ThemeSwitcherProps = {
  selectedTheme: string;
  setSelectedTheme: (theme: "light" | "dark" | "system") => void;
};

function ThemeSwitcherSection({
  selectedTheme,
  setSelectedTheme,
}: ThemeSwitcherProps) {
  return (
    <View className="mb-8">
      <Text className="mb-3 text-lg font-bold text-ink">🌗 Theme Switcher</Text>
      <View className="flex-row space-x-2 rounded-2xl border border-line bg-surface p-1.5">
        {(["light", "dark", "system"] as const).map((t) => {
          const isActive = selectedTheme === t;
          return (
            <Pressable
              key={t}
              onPress={() => setSelectedTheme(t)}
              className={`flex-1 items-center justify-center rounded-xl border py-2.5 ${
                isActive
                  ? "border-accent-ink bg-accent"
                  : "border-transparent bg-surface-2 active:opacity-80"
              }`}
            >
              <Text
                className={`text-xs font-bold capitalize ${
                  isActive
                    ? "font-semibold text-accent-ink"
                    : "font-medium text-ink"
                }`}
              >
                {t}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ColorsSection() {
  return (
    <View className="mb-10">
      <Text className="mb-4 text-lg font-bold text-ink">
        🎨 Color System (Light / Dark)
      </Text>

      <View className="space-y-4">
        {COLOR_TOKENS.map(token => (
          <View
            key={token.name}
            className="flex-row items-center rounded-2xl border border-line bg-surface p-4"
          >
            <View
              className={`size-14 items-center justify-center rounded-2xl ${token.bgClass} border border-line-strong`}
            >
              <Text
                className={`text-center text-[10px] font-bold ${token.textClass}`}
              >
                Aa
              </Text>
            </View>

            <View className="ml-4 flex-1 justify-center">
              <Text className="text-base font-bold text-ink">
                {token.name}
              </Text>
              <Text className="mt-0.5 text-xs text-ink-mute">
                {token.description}
              </Text>
              <View className="mt-1.5 flex-row space-x-3">
                <Text className="rounded-sm bg-bg px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                  Light:
                  {" "}
                  {token.hexLight}
                </Text>
                <Text className="rounded-sm bg-bg px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                  Dark:
                  {" "}
                  {token.hexDark}
                </Text>
              </View>
            </View>

            <View className="ml-2 rounded-lg border border-line bg-bg px-2.5 py-1">
              <Text className="font-mono text-[10px] text-ink-mute">
                {token.bgClass}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function TypographySection() {
  return (
    <View className="mb-10">
      <Text className="mb-4 text-lg font-bold text-ink">
        ✍️ Typography (Inter Font Family)
      </Text>
      <View className="space-y-5 rounded-2xl border border-line bg-surface p-5">
        <View>
          <Text className="mb-1 text-xs font-bold tracking-wider text-ink-soft uppercase">
            Heading 1 (Hero)
          </Text>
          <Text className="text-3xl font-bold text-ink">34px - Bold Text</Text>
          <Text className="mt-1 font-mono text-xs text-ink-mute">
            text-3xl font-bold text-ink
          </Text>
        </View>
        <View className="border-t border-line pt-4">
          <Text className="mb-1 text-xs font-bold tracking-wider text-ink-soft uppercase">
            Heading 2 (Header)
          </Text>
          <Text className="text-2xl font-bold text-ink">24px - Header Text</Text>
          <Text className="mt-1 font-mono text-xs text-ink-mute">
            text-2xl font-bold text-ink
          </Text>
        </View>
        <View className="border-t border-line pt-4">
          <Text className="mb-1 text-xs font-bold tracking-wider text-ink-soft uppercase">
            Subheading
          </Text>
          <Text className="text-lg font-semibold text-ink-2">
            18px - Subheading text
          </Text>
          <Text className="mt-1 font-mono text-xs text-ink-mute">
            text-lg font-semibold text-ink-2
          </Text>
        </View>
        <View className="border-t border-line pt-4">
          <Text className="mb-1 text-xs font-bold tracking-wider text-ink-soft uppercase">
            Body Text (Primary)
          </Text>
          <Text className="text-base font-normal text-ink">
            16px - Standard readable text for lists and labels.
          </Text>
          <Text className="mt-1 font-mono text-xs text-ink-mute">
            text-base font-normal text-ink
          </Text>
        </View>
        <View className="border-t border-line pt-4">
          <Text className="mb-1 text-xs font-bold tracking-wider text-ink-soft uppercase">
            Body Text (Secondary)
          </Text>
          <Text className="text-sm font-normal text-ink-2">
            14px - Lighter font color or smaller size.
          </Text>
          <Text className="mt-1 font-mono text-xs text-ink-mute">
            text-sm font-normal text-ink-2
          </Text>
        </View>
        <View className="border-t border-line pt-4">
          <Text className="mb-1 text-xs font-bold tracking-wider text-ink-soft uppercase">
            Caption / Muted
          </Text>
          <Text className="text-xs font-normal text-ink-mute">
            12px - Muted labels, warnings or metadata annotations.
          </Text>
          <Text className="mt-1 font-mono text-xs text-ink-mute">
            text-xs font-normal text-ink-mute
          </Text>
        </View>
        <View className="border-t border-line pt-4">
          <Text className="mb-1 text-xs font-bold tracking-wider text-ink-soft uppercase">
            Monospace / Keypad
          </Text>
          <Text className="font-mono text-2xl font-bold text-ink">
            123,456.78
          </Text>
          <Text className="mt-1 font-mono text-xs text-ink-mute">
            text-2xl font-mono font-bold text-ink
          </Text>
        </View>
      </View>
    </View>
  );
}

type ButtonsSectionProps = {
  isDark: boolean;
  iconColor: string;
};

function ButtonsSection({ isDark, iconColor }: ButtonsSectionProps) {
  return (
    <View className="mb-10">
      <Text className="mb-4 text-lg font-bold text-ink">🔘 Buttons Showcase</Text>
      <View className="space-y-6 rounded-2xl border border-line bg-surface p-5">
        <View>
          <Text className="mb-2 text-sm font-bold text-ink">Button Sizes</Text>
          <View className="space-y-2">
            <Button label="Large Button (lg)" size="lg" variant="default" />
            <Button label="Default Button" size="default" variant="default" />
            <Button label="Small Button (sm)" size="sm" variant="default" />
          </View>
        </View>
        <View className="border-t border-line pt-4">
          <Text className="mb-2 text-sm font-bold text-ink">Button Variants</Text>
          <View className="space-y-2">
            <Button label="Default variant" variant="default" />
            <Button label="Secondary variant" variant="secondary" />
            <Button label="Outline variant" variant="outline" />
            <Button label="Destructive variant" variant="destructive" />
            <Button label="Ghost variant" variant="ghost" />
            <Button label="Link variant" variant="link" />
          </View>
        </View>
        <View className="border-t border-line pt-4">
          <Text className="mb-2 text-sm font-bold text-ink">Button States</Text>
          <View className="space-y-2">
            <Button label="Loading state" loading={true} />
            <Button label="Disabled state" disabled={true} />
          </View>
        </View>
        <View className="border-t border-line pt-4">
          <Text className="mb-2 text-sm font-bold text-ink">Icon Button Variant</Text>
          <View className="flex-row items-center space-x-3">
            <Button variant="outline" size="icon">
              <Home color={iconColor} width={18} height={18} />
            </Button>
            <Button variant="default" size="icon">
              <Settings color={isDark ? "#0E0E10" : "#FFFFFF"} width={18} height={18} />
            </Button>
            <Text className="text-xs text-ink-mute">Size "icon" buttons for circular/square action slots</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

type ArrowsSectionProps = {
  iconColor: string;
};

function ArrowsSection({ iconColor }: ArrowsSectionProps) {
  return (
    <View className="mb-10">
      <Text className="mb-4 text-lg font-bold text-ink">
        ↕️ Arrows & Carets (Directional Elements)
      </Text>
      <View className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <View className="flex-row items-center justify-between rounded-xl border border-line bg-bg p-3">
          <View className="flex-row items-center space-x-3">
            <View className="items-center justify-center rounded-lg border border-line bg-surface p-2">
              <ArrowRight color={iconColor} />
            </View>
            <View>
              <Text className="text-sm font-bold text-ink">ArrowRight</Text>
              <Text className="text-xs text-ink-mute">
                Used for list item navigation indicators
              </Text>
            </View>
          </View>
          <Text className="font-mono text-xs text-ink-soft">ArrowRight</Text>
        </View>
        <View className="flex-row items-center justify-between rounded-xl border border-line bg-bg p-3">
          <View className="flex-row items-center space-x-3">
            <View className="items-center justify-center rounded-lg border border-line bg-surface p-2.5">
              <CaretDown color={iconColor} width={14} height={14} />
            </View>
            <View>
              <Text className="text-sm font-bold text-ink">CaretDown</Text>
              <Text className="text-xs text-ink-mute">
                Used for selectors and dropdown pills
              </Text>
            </View>
          </View>
          <Text className="font-mono text-xs text-ink-soft">CaretDown</Text>
        </View>
      </View>
    </View>
  );
}

type IconsSectionProps = {
  iconColor: string;
};

const REGISTERED_ICONS = [
  { component: Home, name: "Home" },
  { component: Settings, name: "Settings" },
  { component: Feed, name: "Feed" },
  { component: Github, name: "Github" },
  { component: Language, name: "Language" },
  { component: Rate, name: "Rate" },
  { component: Style, name: "Style" },
  { component: Support, name: "Support" },
  { component: Website, name: "Website" },
  { component: Share, name: "Share" },
];

function IconsSection({ iconColor }: IconsSectionProps) {
  return (
    <View className="mb-4">
      <Text className="mb-4 text-lg font-bold text-ink">
        🧩 SVG Icons Registry
      </Text>
      <View className="flex-row flex-wrap justify-between">
        {REGISTERED_ICONS.map((icon) => {
          const IconComp = icon.component;
          return (
            <View
              key={icon.name}
              className="mb-4 w-[48%] items-center rounded-2xl border border-line bg-surface p-4"
            >
              <View className="mb-2 size-12 items-center justify-center rounded-xl border border-line bg-bg">
                <IconComp color={iconColor} width={22} height={22} />
              </View>
              <Text className="text-center text-xs font-bold text-ink">
                {icon.name}
              </Text>
              <Text className="mt-0.5 text-center text-[10px] text-ink-soft">
                &lt;
                {icon.name}
                {" "}
                /&gt;
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function StyleGuideScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const iconColor = isDark ? "#FAFAFA" : "#0E0E10";
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-line px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          className="rounded-xl border border-line bg-surface px-4 py-2 active:opacity-70"
        >
          <Text className="text-sm font-semibold text-ink">← Back</Text>
        </Pressable>
        <Text className="text-xl font-bold text-ink">Style Guide</Text>
        <View className="w-16" />
      </View>

      <ScrollView
        className="flex-1 px-6 py-4"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Intro */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-ink">
            Design System Guide
          </Text>
          <Text className="mt-1 text-sm text-ink-mute">
            Visual tokens, typography, buttons, and icons from the Design B
            ("Unified surface") spec, using Nativewind / Uniwind.
          </Text>
        </View>

        <ThemeSwitcherSection
          selectedTheme={selectedTheme}
          setSelectedTheme={setSelectedTheme}
        />

        <ColorsSection />

        <TypographySection />

        <ButtonsSection isDark={isDark} iconColor={iconColor} />

        <ArrowsSection iconColor={iconColor} />

        <IconsSection iconColor={iconColor} />
      </ScrollView>
    </SafeAreaView>
  );
}
