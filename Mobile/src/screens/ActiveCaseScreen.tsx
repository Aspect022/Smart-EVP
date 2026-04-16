import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { RootScreenProps } from "../../App";
import { useDispatchState } from "../context/DispatchContext";
import { useLanguage } from "../context/LanguageContext";
import { colors, fonts, shadows } from "../theme";

type TabKey = "overview" | "brief";

function formatEta(seconds: number | null) {
  if (seconds == null) {
    return "--:--";
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.max(seconds % 60, 0);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function normalizeBrief(input: Record<string, unknown> | null) {
  if (!input) {
    return null;
  }

  return {
    age: input.age ?? input.patient_age ?? "Unknown",
    gender: input.gender ?? input.patient_gender ?? "Unknown",
    priority: input.priority ?? "P2",
    chiefComplaint: input.chiefComplaint ?? input.chief_complaint ?? "Pending assessment",
    suspectedDiagnosis: input.suspectedDiagnosis ?? input.suspected_diagnosis ?? "Pending assessment",
    vitals: (input.vitals as Record<string, unknown> | undefined) ?? {},
    resources:
      (Array.isArray(input.resources) ? input.resources : undefined) ??
      (Array.isArray(input.required_resources) ? input.required_resources : undefined) ??
      [],
    medications: input.medications ?? input.current_medications ?? "Unknown",
    allergies: input.allergies ?? "Unknown",
  };
}

export function ActiveCaseScreen({ navigation }: RootScreenProps<"ActiveCase">) {
  const { t } = useLanguage();
  const { activeCase, signalState, distanceM, etaSeconds, medicalBrief, transcript, pendingAlertCaseId, driverStatus } =
    useDispatchState();
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    if (!activeCase) {
      navigation.replace("Home");
    }
  }, [activeCase, navigation]);

  useEffect(() => {
    if (pendingAlertCaseId && driverStatus !== "ACCEPTED") {
      navigation.replace("Alert");
    }
  }, [driverStatus, navigation, pendingAlertCaseId]);

  const brief = useMemo(() => normalizeBrief(medicalBrief as Record<string, unknown> | null), [medicalBrief]);
  const corridorColor = signalState === "GREEN" ? colors.green : signalState === "AMBER" ? colors.amber : colors.red;

  if (!activeCase) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t("activeCase")}</Text>
            <Text style={styles.headerSubtitle}>
              Case #{activeCase.id} · {activeCase.location}
            </Text>
          </View>
          <Text style={styles.eta}>{formatEta(etaSeconds)}</Text>
        </View>

        <View style={[styles.corridorCard, { borderTopColor: corridorColor }]}>
          <View style={[styles.corridorDot, { backgroundColor: corridorColor }, signalState === "GREEN" && shadows.greenGlow]} />
          <View style={styles.corridorBody}>
            <Text style={[styles.corridorTitle, { color: corridorColor }]}>{t("signal")}</Text>
            <Text style={styles.corridorSubtitle}>
              {signalState === "GREEN"
                ? "GREEN CORRIDOR ACTIVE — proceed without stopping"
                : signalState === "AMBER"
                  ? "Approaching corridor threshold"
                  : "Signal sequence still red"}
            </Text>
          </View>
          <View style={styles.distanceWrap}>
            <Text style={styles.distanceValue}>{distanceM != null ? `${distanceM}m` : "--"}</Text>
            <Text style={styles.distanceLabel}>DIST</Text>
          </View>
        </View>

        <View style={styles.tabBar}>
          {[
            { key: "overview", label: t("overview") },
            { key: "brief", label: t("patientBrief") },
          ].map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key as TabKey)}
              style={[styles.tabButton, tab === item.key && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {tab === "overview" ? (
            <View style={styles.panel}>
              <View style={styles.block}>
                <Text style={styles.blockLabel}>Severity</Text>
                <Text style={styles.blockValue}>{activeCase.severity}</Text>
              </View>
              <View style={styles.block}>
                <Text style={styles.blockLabel}>Complaint</Text>
                <Text style={styles.body}>{activeCase.complaint}</Text>
              </View>
              <View style={styles.block}>
                <Text style={styles.blockLabel}>Transcript Feed</Text>
                <Text style={styles.body}>{transcript || "Awaiting paramedic transcript..."}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.panel}>
              {brief ? (
                <>
                  <View style={styles.block}>
                    <Text style={styles.blockLabel}>Suspected Diagnosis</Text>
                    <Text style={[styles.blockValue, { color: colors.amber }]}>{String(brief.suspectedDiagnosis)}</Text>
                  </View>
                  <View style={styles.block}>
                    <Text style={styles.blockLabel}>Chief Complaint</Text>
                    <Text style={styles.body}>{String(brief.chiefComplaint)}</Text>
                  </View>
                  <View style={styles.vitalsGrid}>
                    {[
                      ["BP", (brief.vitals as Record<string, unknown>).bp],
                      ["HR", (brief.vitals as Record<string, unknown>).hr],
                      ["SpO2", (brief.vitals as Record<string, unknown>).spo2],
                      ["GCS", (brief.vitals as Record<string, unknown>).gcs],
                    ].map(([label, value]) => (
                      <View key={label} style={styles.vitalCard}>
                        <Text style={styles.vitalLabel}>{label}</Text>
                        <Text style={styles.vitalValue}>{value ? String(value) : "--"}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.block}>
                    <Text style={styles.blockLabel}>Resources</Text>
                    <View style={styles.resourcesWrap}>
                      {(brief.resources as unknown[]).map((resource) => (
                        <View key={String(resource)} style={styles.resourceBadge}>
                          <Text style={styles.resourceText}>{String(resource)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.block}>
                    <Text style={styles.blockLabel}>Allergies / Medications</Text>
                    <Text style={styles.body}>
                      Allergies: {String(brief.allergies)}
                      {"\n"}
                      Medications:{" "}
                      {Array.isArray(brief.medications)
                        ? (brief.medications as unknown[]).map(String).join(", ")
                        : String(brief.medications)}
                    </Text>
                  </View>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiText}>AI GENERATED · Gemma medical brief</Text>
                  </View>
                </>
              ) : (
                <View style={styles.block}>
                  <Text style={styles.blockLabel}>Transcript Feed</Text>
                  <Text style={styles.body}>{transcript || "Waiting for the medical brief pipeline..."}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
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
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  headerSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  eta: {
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 34,
  },
  corridorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  corridorDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  corridorBody: {
    flex: 1,
  },
  corridorTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
  },
  corridorSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 17,
  },
  distanceWrap: {
    alignItems: "flex-end",
  },
  distanceValue: {
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 20,
  },
  distanceLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: colors.red,
  },
  tabText: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  panel: {
    gap: 14,
  },
  block: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  blockLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  blockValue: {
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 20,
  },
  body: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 20,
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  vitalCard: {
    width: "47%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg2,
  },
  vitalLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  vitalValue: {
    marginTop: 8,
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 20,
  },
  resourcesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  resourceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(74,222,128,0.08)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.25)",
  },
  resourceText: {
    color: colors.green,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  aiBadge: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    backgroundColor: "rgba(167,139,250,0.08)",
  },
  aiText: {
    color: colors.purple,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});

