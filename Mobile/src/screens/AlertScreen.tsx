import { useEffect, useRef } from "react";
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, Vibration, View } from "react-native";
import * as Haptics from "expo-haptics";

import { RootScreenProps } from "../../App";
import { useDispatchState } from "../context/DispatchContext";
import { useDriver } from "../context/DriverContext";
import { useLanguage } from "../context/LanguageContext";
import { colors, fonts, shadows } from "../theme";

export function AlertScreen({ navigation }: RootScreenProps<"Alert">) {
  const { driver } = useDriver();
  const { t } = useLanguage();
  const { activeCase, accepting, acceptCurrentCase, driverStatus } = useDispatchState();
  const flash = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Vibration.vibrate([0, 350, 180, 350]);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);

    Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 150, useNativeDriver: false }),
      Animated.timing(flash, { toValue: 0, duration: 450, useNativeDriver: false }),
    ]).start();

    Animated.spring(cardY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();
  }, [cardY, flash]);

  useEffect(() => {
    if (!activeCase) {
      navigation.replace("Home");
    }
  }, [activeCase, navigation]);

  useEffect(() => {
    if (driverStatus === "ACCEPTED") {
      navigation.replace("ActiveCase");
    }
  }, [driverStatus, navigation]);

  if (!activeCase || !driver) {
    return null;
  }

  const backgroundColor = flash.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.bg, "rgba(255,59,59,0.14)"],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.card, shadows.redGlow, { transform: [{ translateY: cardY }] }]}>
          <Text style={styles.eyebrow}>{t("dispatchAlert")}</Text>
          <Text style={styles.title}>{activeCase.severity}</Text>
          <View style={styles.section}>
            <Text style={styles.label}>{t("location")}</Text>
            <Text style={styles.value}>{activeCase.location}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>{t("symptoms")}</Text>
            <Text style={styles.body}>{activeCase.complaint}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Case #{activeCase.id}</Text>
            <Text style={styles.metaText}>{driver.vehicle}</Text>
          </View>

          <Pressable
            disabled={accepting}
            onPress={async () => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
              await acceptCurrentCase(driver);
            }}
            style={({ pressed }) => [styles.acceptButton, pressed && !accepting && styles.acceptButtonPressed]}
          >
            <Text style={styles.acceptText}>{accepting ? "SYNCING..." : `✓ ${t("accept").toUpperCase()}`}</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: colors.border,
    borderTopColor: colors.red,
    padding: 22,
  },
  eyebrow: {
    color: colors.red,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 12,
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 32,
  },
  section: {
    marginTop: 18,
    gap: 6,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  value: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  body: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 21,
  },
  metaRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  acceptButton: {
    marginTop: 26,
    minHeight: 58,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green,
  },
  acceptButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  acceptText: {
    color: colors.bg,
    fontFamily: fonts.displayBold,
    fontSize: 18,
    letterSpacing: 1,
  },
});

