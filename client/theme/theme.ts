import { MD3DarkTheme, MD3LightTheme, configureFonts } from "react-native-paper";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";

export const colors = {
  primary: "#22C55E",
  primaryDark: "#16A34A",
  ink: "#0F172A",
  muted: "#64748B",
  line: "#E2E8F0",
  canvas: "#F8FAFC",
  card: "#FFFFFF",
  darkCanvas: "#07130D",
  darkCard: "#101C16"
};

const fonts = configureFonts({ config: { fontFamily: "System" } });

export function createPaperTheme(isDark: boolean) {
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    roundness: 6,
    fonts,
    colors: {
      ...base.colors,
      primary: colors.primary,
      secondary: "#0EA5E9",
      tertiary: "#F97316",
      background: isDark ? colors.darkCanvas : colors.canvas,
      surface: isDark ? colors.darkCard : colors.card,
      surfaceVariant: isDark ? "#17231D" : "#F1F5F9",
      outline: isDark ? "#284033" : colors.line
    }
  };
}

export const navigationLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.canvas,
    card: colors.card,
    border: colors.line,
    text: colors.ink
  }
};

export const navigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.darkCanvas,
    card: colors.darkCard,
    border: "#284033",
    text: "#ECFDF5"
  }
};
