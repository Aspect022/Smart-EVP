import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "@/src/theme";

export type SectionLabelProps = {
  children: React.ReactNode;
  color?: string;
};

export function SectionLabel({
  children,
  color = colors.textMuted,
}: SectionLabelProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  line: {
    width: 16,
    height: 1,
    opacity: 0.6,
  },
  label: {
    ...typography.labelM,
  },
});

export default SectionLabel;
