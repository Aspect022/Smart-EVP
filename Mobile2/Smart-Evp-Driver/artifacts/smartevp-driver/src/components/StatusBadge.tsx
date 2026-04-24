import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "@/src/theme";

import { LiveDot } from "./LiveDot";

export type StatusBadgeColor =
  | "red"
  | "amber"
  | "cyan"
  | "green"
  | "purple"
  | "muted";

export type StatusBadgeProps = {
  label: string;
  color: StatusBadgeColor;
};

type Palette = {
  full: string;
  soft: string;
};

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function paletteFor(color: StatusBadgeColor): Palette {
  switch (color) {
    case "red":
      return { full: colors.red, soft: colors.redSoft };
    case "amber":
      return { full: colors.amber, soft: colors.amberSoft };
    case "cyan":
      return { full: colors.cyan, soft: colors.cyanSoft };
    case "green":
      return { full: colors.green, soft: colors.greenSoft };
    case "purple":
      return { full: colors.purple, soft: colors.purpleSoft };
    case "muted":
    default:
      return {
        full: colors.textDim,
        soft: "rgba(136,146,170,0.1)",
      };
  }
}

export function StatusBadge({ label, color }: StatusBadgeProps) {
  const { full, soft } = paletteFor(color);
  const shouldPulse = color === "green" || color === "cyan";
  const borderColor = full.startsWith("#")
    ? hexToRgba(full, 0.3)
    : full;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: soft,
          borderColor,
        },
      ]}
    >
      {shouldPulse ? (
        <LiveDot color={full} size={6} />
      ) : (
        <View
          style={[styles.staticDot, { backgroundColor: full }]}
        />
      )}
      <Text style={[styles.label, { color: full }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
    alignSelf: "flex-start",
  },
  staticDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...typography.labelM,
  },
});

export default StatusBadge;
