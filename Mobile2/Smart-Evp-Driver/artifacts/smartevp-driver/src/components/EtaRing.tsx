import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { colors, typography } from "@/src/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type EtaRingProps = {
  totalSeconds: number;
  remainingSeconds: number;
  size?: number;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${pad(minutes)}:${pad(secs)}`;
}

function colorForRatio(ratio: number): string {
  if (ratio > 0.5) return colors.cyan;
  if (ratio > 0.2) return colors.amber;
  return colors.red;
}

function softColorFor(color: string): string {
  if (color === colors.cyan) return colors.cyanSoft;
  if (color === colors.amber) return colors.amberSoft;
  return colors.redSoft;
}

export function EtaRing({
  totalSeconds,
  remainingSeconds,
  size = 120,
}: EtaRingProps) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const ratio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const ringColor = colorForRatio(clampedRatio);
  const trackColor = softColorFor(ringColor);

  const progress = useSharedValue(clampedRatio);

  useEffect(() => {
    progress.value = withTiming(clampedRatio, { duration: 600 });
  }, [clampedRatio, progress]);

  const dashOffset = useDerivedValue(
    () => circumference * (1 - progress.value),
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.time, { color: colors.textPrimary }]}>
          {formatTime(remainingSeconds)}
        </Text>
        <Text style={styles.label}>ETA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  time: {
    ...typography.displayL,
  },
  label: {
    ...typography.labelM,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default EtaRing;
