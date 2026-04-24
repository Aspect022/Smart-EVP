import type { TextStyle } from "react-native";

export const colors = {
  bg: "#050810",
  bg2: "#0a0d18",
  surface: "#0f1422",
  surfaceHigh: "#141928",
  glassBorder: "rgba(255,255,255,0.07)",
  glassBorderActive: "rgba(255,255,255,0.15)",

  red: "#ff3b3b",
  redGlow: "rgba(255,59,59,0.35)",
  redSoft: "rgba(255,59,59,0.12)",

  amber: "#f59e0b",
  amberGlow: "rgba(245,158,11,0.3)",
  amberSoft: "rgba(245,158,11,0.1)",

  cyan: "#22d3ee",
  cyanGlow: "rgba(34,211,238,0.25)",
  cyanSoft: "rgba(34,211,238,0.08)",

  green: "#4ade80",
  greenGlow: "rgba(74,222,128,0.4)",
  greenSoft: "rgba(74,222,128,0.1)",

  purple: "#a78bfa",
  purpleSoft: "rgba(167,139,250,0.1)",

  textPrimary: "#f0f4ff",
  textDim: "#8892aa",
  textMuted: "#444d66",
} as const;

export const typography = {
  displayXL: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
  } as TextStyle,
  displayL: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  } as TextStyle,
  displayM: {
    fontSize: 24,
    fontWeight: "700",
  } as TextStyle,
  headingL: {
    fontSize: 20,
    fontWeight: "700",
  } as TextStyle,
  headingM: {
    fontSize: 16,
    fontWeight: "600",
  } as TextStyle,
  bodyL: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 22,
  } as TextStyle,
  bodyM: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 20,
  } as TextStyle,
  labelL: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  } as TextStyle,
  labelM: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  } as TextStyle,
  mono: {
    fontFamily: "monospace",
    fontSize: 13,
  } as TextStyle,
} as const;

export const theme = {
  colors,
  typography,
};

export default theme;
