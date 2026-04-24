import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/src/theme";

export type SignalStripProps = {
  state: "RED" | "GREEN" | "IDLE";
};

const STRIP_HEIGHT = 3;

export function SignalStrip({ state }: SignalStripProps) {
  const { width } = useWindowDimensions();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (state === "GREEN") {
      shimmer.value = 0;
      shimmer.value = withRepeat(
        withTiming(1, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        false,
      );
    } else {
      shimmer.value = 0;
    }
  }, [state, shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -width + shimmer.value * (width * 2) },
    ],
  }));

  if (state === "IDLE") {
    return <View style={[styles.strip, { opacity: 0 }]} />;
  }

  if (state === "RED") {
    return (
      <View
        style={[styles.strip, { backgroundColor: colors.red }]}
      />
    );
  }

  return (
    <View
      style={[styles.strip, { backgroundColor: colors.green }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { width: width },
          shimmerStyle,
        ]}
      >
        <LinearGradient
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.6)",
            "rgba(255,255,255,0)",
          ]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    height: STRIP_HEIGHT,
    width: "100%",
    overflow: "hidden",
  },
});

export default SignalStrip;
