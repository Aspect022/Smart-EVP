import { Platform } from "react-native";

export const colors = {
  bg: "#080b12",
  bg2: "#0d1117",
  bg3: "#111620",
  card: "#131924",
  border: "#1e2838",
  border2: "#243044",
  red: "#ff3b3b",
  amber: "#f59e0b",
  cyan: "#22d3ee",
  green: "#4ade80",
  purple: "#a78bfa",
  textPrimary: "#e2e8f0",
  textDim: "#94a3b8",
  textMuted: "#64748b",
};

export const fonts = {
  display: Platform.select({ ios: "System", android: "sans-serif-medium", default: "System" }),
  displayBold: Platform.select({ ios: "System", android: "sans-serif-black", default: "System" }),
  mono: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  monoBold: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
};

export const shadows = {
  greenGlow: {
    shadowColor: colors.green,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  redGlow: {
    shadowColor: colors.red,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
};

