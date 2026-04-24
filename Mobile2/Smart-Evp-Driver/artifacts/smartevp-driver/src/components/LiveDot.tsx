import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export type LiveDotProps = {
  color: string;
  size?: number;
};

export function LiveDot({ color, size = 8 }: LiveDotProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
  }, [progress]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 1.6 }],
    opacity: 0.3 * (1 - progress.value),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + Math.sin(progress.value * Math.PI) * 0.15 }],
  }));

  const ringSize = size * 2;

  return (
    <View
      style={[
        styles.wrapper,
        { width: ringSize, height: ringSize },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            backgroundColor: color,
          },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          dotStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
  },
  dot: {
    zIndex: 2,
  },
});

export default LiveDot;
