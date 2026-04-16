import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { RootScreenProps } from "../../App";
import { colors, fonts } from "../theme";

type Props = RootScreenProps<"Splash"> & {
  hasDriver: boolean;
};

export function SplashScreen({ navigation, hasDriver }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start(() => {
      navigation.replace(hasDriver ? "Home" : "Login");
    });
  }, [hasDriver, navigation, progress]);

  const width = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
      }),
    [progress],
  );

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.logo}>
          Smart<Text style={{ color: colors.red }}>EVP+</Text>
        </Text>
        <Text style={styles.subtitle}>ERIS v2.0 · Driver</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, { width }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "space-between",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 44,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 8,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  track: {
    height: 2,
    backgroundColor: colors.border,
  },
  bar: {
    height: 2,
    backgroundColor: colors.red,
  },
});

