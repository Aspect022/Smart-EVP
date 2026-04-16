import { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <View>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

export function HomeScreen({ navigation }: RootScreenProps<"Home">) {
  const { driver } = useDriver();
  const { t, language, setLanguage } = useLanguage();
  const { connected, pendingAlertCaseId, activeCase, driverStatus } = useDispatchState();
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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.safe}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.kicker}>SMARTEVP DRIVER</Text>
            <Text style={styles.greeting}>
              {t("hello")}, {firstName}
            </Text>
            <Text style={styles.vehicle}>
              {driver?.vehicle} · {driver?.license}
            </Text>
          </View>
          <Pressable style={styles.profileButton} onPress={() => navigation.navigate("Profile")}>
            <Text style={styles.profileInitial}>{driver?.name?.[0] ?? "D"}</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <Text style={styles.heroBadge}>SHIFT ACTIVE</Text>
            <View style={styles.connectionPill}>
              <View style={[styles.connectionDot, { backgroundColor: connected ? colors.green : colors.red }]} />
              <Text style={styles.connectionText}>{connected ? "LINKED" : "RETRYING"}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Animated.View style={[styles.dot, shadows.greenGlow, { transform: [{ scale: pulse }] }]} />
            <Text style={styles.statusText}>{t("available")}</Text>
          </View>
          <Text style={styles.statusSub}>{t("waitingDispatch")}</Text>

          <View style={styles.statsRow}>
            <StatCard label={t("casesToday")} value="3" color={colors.cyan} />
            <StatCard label={t("hoursShift")} value="4.5h" color={colors.amber} />
            <StatCard label={t("distance")} value="38km" color={colors.purple} />
          </View>
        </View>

        <View style={styles.bottomStack}>
          {activeCase ? (
            <View style={[styles.sectionCard, styles.dispatchCard]}>
              <Text style={styles.dispatchEyebrow}>LIVE DISPATCH</Text>
              <Text style={styles.dispatchTitle}>
                {activeCase.severity} case waiting for {driverStatus === "ACCEPTED" ? "en route view" : "driver action"}
              </Text>
              <Text style={styles.dispatchBody}>
                Case {activeCase.id} · {activeCase.location}
                {"\n"}
                {activeCase.complaint}
              </Text>
              <View style={styles.dispatchActions}>
                {driverStatus === "ACCEPTED" ? (
                  <Pressable style={[styles.actionButton, styles.actionButtonPrimary]} onPress={() => navigation.navigate("ActiveCase")}>
                    <Text style={styles.actionButtonPrimaryText}>OPEN ACTIVE CASE</Text>
                  </Pressable>
                ) : (
                  <Pressable style={[styles.actionButton, styles.actionButtonDanger]} onPress={() => navigation.navigate("Alert")}>
                    <Text style={styles.actionButtonDangerText}>OPEN ALERT</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : null}

          <View style={styles.sectionCard}>
            <SectionHeader
              eyebrow="DISPATCH FLOW"
              title="New emergency classifications trigger this device"
              body="The moment the backend opens a case, the phone escalates into the driver alert flow."
            />
          </View>

          <View style={styles.sectionCard}>
            <SectionHeader
              eyebrow="DEVICE LINK"
              title="This phone is paired to the active ambulance"
              body={connected ? "Backend reachable on local network. Dispatch state is refreshing every 2 seconds." : "Backend link is down. Check Wi-Fi, backend power, and the configured laptop URL."}
            />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>LANGUAGE</Text>
            <Text style={styles.sectionTitle}>Language stays close to core controls</Text>
            <View style={styles.languageRow}>
              {[
                ["English", "en"],
                ["हिंदी", "hi"],
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerTextWrap: {
    flex: 1,
    paddingTop: 4,
    paddingRight: 12,
  },
  kicker: {
    color: colors.cyan,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3,
  },
  greeting: {
    marginTop: 8,
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 30,
    lineHeight: 34,
  },
  vehicle: {
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.14)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    marginTop: 4,
  },
  profileInitial: {
    color: colors.cyan,
    fontFamily: fonts.displayBold,
    fontSize: 18,
  },
  heroCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: colors.border,
    borderTopColor: colors.green,
    backgroundColor: colors.card,
  },
  heroBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  heroBadge: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2.4,
  },
  connectionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg2,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
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
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bg2,
  },
  statValue: {
    fontFamily: fonts.displayBold,
    fontSize: 23,
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
  bottomStack: {
    gap: 12,
    marginTop: 14,
  },
  sectionCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
  },
  sectionTitle: {
    marginTop: 8,
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 24,
  },
  sectionBody: {
    marginTop: 8,
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 19,
  },
  languageRow: {
    gap: 8,
    marginTop: 14,
  },
  languageButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
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
    fontSize: 12,
  },
  languageTextActive: {
    color: colors.cyan,
  },
  dispatchCard: {
    borderColor: "rgba(255,59,59,0.24)",
    backgroundColor: "rgba(255,59,59,0.07)",
  },
  dispatchEyebrow: {
    color: colors.red,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
  },
  dispatchTitle: {
    marginTop: 8,
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 20,
    lineHeight: 26,
  },
  dispatchBody: {
    marginTop: 8,
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 19,
  },
  dispatchActions: {
    marginTop: 14,
    flexDirection: "row",
  },
  actionButton: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonPrimary: {
    backgroundColor: colors.green,
  },
  actionButtonDanger: {
    backgroundColor: colors.red,
  },
  actionButtonPrimaryText: {
    color: colors.bg,
    fontFamily: fonts.displayBold,
    fontSize: 13,
    letterSpacing: 1,
  },
  actionButtonDangerText: {
    color: "#fff5f5",
    fontFamily: fonts.displayBold,
    fontSize: 13,
    letterSpacing: 1,
  },
});
