import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";

import { colors } from "@/src/theme";

export type GlassCardProps = {
  children: React.ReactNode;
  topBorderColor?: string;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
};

export function GlassCard({
  children,
  topBorderColor,
  style,
  onPress,
}: GlassCardProps) {
  const content = (
    <View style={styles.inner}>
      {topBorderColor ? (
        <View
          style={[
            styles.topBorder,
            { backgroundColor: topBorderColor },
          ]}
        />
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.card, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  inner: {
    flex: 1,
  },
  topBorder: {
    height: 2,
    width: "100%",
  },
  content: {
    padding: 16,
  },
});

export default GlassCard;
