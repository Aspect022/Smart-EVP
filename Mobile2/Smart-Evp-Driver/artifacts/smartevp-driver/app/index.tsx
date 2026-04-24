import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { colors, typography } from "@/src/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function SplashScreen() {
  const router = useRouter();

  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslate = useSharedValue(10);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 110 });

    taglineOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    taglineTranslate.value = withDelay(
      200,
      withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }),
    );

    progressWidth.value = withDelay(
      600,
      withTiming(SCREEN_WIDTH, {
        duration: 1800,
        easing: Easing.inOut(Easing.cubic),
      }),
    );

    const navTimer = setTimeout(() => {
      router.replace("/login");
    }, 2200);

    return () => clearTimeout(navTimer);
  }, [
    logoOpacity,
    logoScale,
    taglineOpacity,
    taglineTranslate,
    progressWidth,
    router,
  ]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslate.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />

      <View style={styles.center}>
        <View style={styles.glowWrap} pointerEvents="none">
          <View style={styles.glowOuter} />
          <View style={styles.glowMid} />
          <View style={styles.glowInner} />
        </View>

        <Animated.View style={logoStyle}>
          <Text style={styles.logo}>
            <Text style={styles.logoLight}>Smart</Text>
            <Text style={styles.logoAccent}>EVP+</Text>
          </Text>
        </Animated.View>

        <Animated.Text style={[styles.tagline, taglineStyle]}>
          ERIS v2.0 · DRIVER
        </Animated.Text>
      </View>

      <Animated.View style={[styles.progressBar, progressStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowWrap: {
    position: "absolute",
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  glowOuter: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.red,
    opacity: 0.04,
  },
  glowMid: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.red,
    opacity: 0.08,
  },
  glowInner: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.red,
    opacity: 0.15,
  },
  logo: {
    ...typography.displayL,
    letterSpacing: -1,
  },
  logoLight: {
    color: colors.textPrimary,
    ...typography.displayL,
    letterSpacing: -1,
  },
  logoAccent: {
    color: colors.red,
    ...typography.displayL,
    letterSpacing: -1,
  },
  tagline: {
    ...typography.labelM,
    color: colors.textMuted,
    marginTop: 14,
    letterSpacing: 3,
  },
  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: colors.red,
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
});
