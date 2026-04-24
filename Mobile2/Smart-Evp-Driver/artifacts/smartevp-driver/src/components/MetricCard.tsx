import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "@/src/theme";

export type MetricCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  icon?: React.ReactNode;
};

export function MetricCard({
  label,
  value,
  unit,
  color,
  icon,
}: MetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconWrap: {
    opacity: 0.6,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  value: {
    ...typography.displayM,
  },
  unit: {
    ...typography.bodyM,
    color: colors.textDim,
  },
  label: {
    ...typography.labelM,
    color: colors.textMuted,
  },
});

export default MetricCard;
