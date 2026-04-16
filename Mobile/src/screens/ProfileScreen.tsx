import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RootScreenProps } from "../../App";
import { useDispatchState } from "../context/DispatchContext";
import { useDriver } from "../context/DriverContext";
import { useLanguage } from "../context/LanguageContext";
import { colors, fonts } from "../theme";

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statMetric, { color }]}>{value}</Text>
      <Text style={styles.statCaption}>{label}</Text>
    </View>
  );
}

export function ProfileScreen({ navigation }: RootScreenProps<"Profile">) {
  const { driver } = useDriver();
  const { t, language, setLanguage } = useLanguage();
  const { pendingAlertCaseId } = useDispatchState();

  useEffect(() => {
    if (pendingAlertCaseId) {
      navigation.navigate("Alert");
    }
  }, [navigation, pendingAlertCaseId]);

  if (!driver) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t("back")}</Text>
        </Pressable>

        <Text style={styles.eyebrow}>{t("profile").toUpperCase()}</Text>

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{driver.name[0]}</Text>
          </View>
          <Text style={styles.name}>{driver.name}</Text>
          <Text style={styles.meta}>{driver.vehicle}</Text>
          <Text style={styles.meta}>{driver.license}</Text>
        </View>

        <Text style={styles.section}>TODAY</Text>
        <View style={styles.statsRow}>
          <StatItem label="Cases" value="3" color={colors.cyan} />
          <StatItem label="Distance" value="38 km" color={colors.amber} />
          <StatItem label="Avg Response" value="3m 45s" color={colors.green} />
        </View>

        <Text style={styles.section}>LANGUAGE</Text>
        <View style={styles.languageCard}>
          {[
            ["English", "en"],
            ["हिंदी", "hi"],
            ["ಕನ್ನಡ", "kn"],
          ].map(([label, code]) => (
            <Pressable
              key={code}
              style={[styles.languageButton, language === code && styles.languageButtonActive]}
              onPress={() => setLanguage(code as "en" | "hi" | "kn")}
            >
              <Text style={[styles.languageText, language === code && styles.languageTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteEyebrow}>NEXT</Text>
          <Text style={styles.noteTitle}>This section can later hold shift logs, payout records, and vehicle readiness.</Text>
          <Text style={styles.noteText}>
            For now, keeping it focused makes the app feel more like a real dispatch tool and less like a generated
            demo template.
          </Text>
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
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  backText: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  eyebrow: {
    marginTop: 16,
    marginBottom: 18,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3,
  },
  heroCard: {
    alignItems: "center",
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: colors.border,
    borderTopColor: colors.cyan,
    backgroundColor: colors.card,
    marginBottom: 24,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.14)",
    borderWidth: 2,
    borderColor: "rgba(34,211,238,0.35)",
    marginBottom: 14,
  },
  avatarText: {
    color: colors.cyan,
    fontFamily: fonts.displayBold,
    fontSize: 30,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 24,
  },
  meta: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  section: {
    marginBottom: 10,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statMetric: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
  },
  statCaption: {
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    textAlign: "center",
    textTransform: "uppercase",
  },
  languageCard: {
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
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
    backgroundColor: "rgba(34,211,238,0.08)",
  },
  languageText: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  languageTextActive: {
    color: colors.cyan,
  },
  noteCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: colors.border,
    borderLeftColor: colors.purple,
    backgroundColor: colors.card,
  },
  noteEyebrow: {
    color: colors.purple,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
  },
  noteTitle: {
    marginTop: 8,
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 24,
  },
  noteText: {
    marginTop: 8,
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 18,
  },
});
