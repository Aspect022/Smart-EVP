import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export type PulsingRingProps = {
  color: string;
  size: number;
  rings?: number;
  duration?: number;
};

type RingProps = {
  color: string;
  size: number;
  delay: number;
  duration: number;
};

function Ring({ color, size, delay, duration }: RingProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.out(Easing.quad),
        }),
        -1,
        false,
      ),
    );
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 1.6 }],
    opacity: 0.6 * (1 - progress.value),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function PulsingRing({
  color,
  size,
  rings = 3,
  duration = 2000,
}: PulsingRingProps) {
  const stagger = duration / rings;

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { width: size, height: size }]}
    >
      {Array.from({ length: rings }).map((_, idx) => (
        <Ring
          key={idx}
          color={color}
          size={size}
          delay={idx * stagger}
          duration={duration}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
  },
});

export default PulsingRing;
