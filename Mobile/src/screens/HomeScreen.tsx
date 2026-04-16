import { useEffect, useRef } from "react";
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { RootScreenProps } from "../../App";
import { useDispatchState } from "../context/DispatchContext";
import { useDriver } from "../context/DriverContext";
import { useLanguage } from "../context/LanguageContext";
import { colors, fonts, shadows } from "../theme";

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function HomeScreen({ navigation }: RootScreenProps<"Home">) {
  const { driver } = useDriver();
  const { t, language, setLanguage } = useLanguage();
  const { connected, pendingAlertCaseId } = useDispatchState();
  const pulse = useRef(new Animated.Value(1)).current;
  const driverName = driver?.name ?? "Driver";
  const firstName = driverName.split(" ")[0];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  useEffect(() => {
    if (pendingAlertCaseId) {
      navigation.navigate("Alert");
    }
  }, [navigation, pendingAlertCaseId]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {t("hello")}, {firstName}
            </Text>
            <Text style={styles.vehicle}>
              {driver?.vehicle} · {driver?.license}
            </Text>
          </View>
          <Pressable style={styles.profileButton} onPress={() => navigation.navigate("Profile")}>
            <Text style={styles.profileInitial}>{driver?.name[0]}</Text>
          </Pressable>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Animated.View style={[styles.dot, shadows.greenGlow, { transform: [{ scale: pulse }] }]} />
            <Text style={styles.statusText}>{t("available")}</Text>
          </View>
          <Text style={styles.statusSub}>{t("waitingDispatch")}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label={t("casesToday")} value="3" color={colors.cyan} />
          <StatCard label={t("hoursShift")} value="4.5h" color={colors.amber} />
          <StatCard label={t("distance")} value="38km" color={colors.purple} />
        </View>

        <View style={styles.connectionRow}>
          <View style={[styles.connectionDot, { backgroundColor: connected ? colors.green : colors.red }]} />
          <Text style={styles.connectionText}>{connected ? t("connected") : t("reconnecting")}</Text>
        </View>

        <View style={styles.languageRow}>
          {[
            ["EN", "en"],
            ["हिं", "hi"],
            ["ಕನ್ನಡ", "kn"],
          ].map(([label, code]) => (
            <Pressable
              key={code}
              onPress={() => setLanguage(code as "en" | "hi" | "kn")}
              style={[styles.languageButton, language === code && styles.languageButtonActive]}
            >
              <Text style={[styles.languageText, language === code && styles.languageTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  greeting: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  vehicle: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.14)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
  },
  profileInitial: {
    color: colors.cyan,
    fontFamily: fonts.displayBold,
    fontSize: 18,
  },
  statusCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 2,
    borderColor: colors.border,
    borderTopColor: colors.green,
    backgroundColor: colors.card,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.green,
  },
  statusText: {
    color: colors.green,
    fontFamily: fonts.displayBold,
    fontSize: 22,
  },
  statusSub: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderTopWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  statValue: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
  },
  statLabel: {
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textAlign: "center",
    textTransform: "uppercase",
  },
  connectionRow: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  languageRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg2,
  },
  languageButtonActive: {
    borderColor: colors.cyan,
    backgroundColor: "rgba(34,211,238,0.1)",
  },
  languageText: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  languageTextActive: {
    color: colors.cyan,
  },
});
