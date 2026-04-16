import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

function DataPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataPill}>
      <Text style={styles.dataPillLabel}>{label}</Text>
      <Text style={styles.dataPillValue}>{value}</Text>
    </View>
  );
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
  const corridorLabel =
    signalState === "GREEN"
      ? "Green corridor active"
      : signalState === "AMBER"
        ? "Preemption threshold approaching"
        : "Signal path still red";

  if (!activeCase) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroEyebrow}>ACTIVE RESPONSE</Text>
              <Text style={styles.heroTitle}>Case #{activeCase.id}</Text>
              <Text style={styles.heroLocation}>{activeCase.location}</Text>
            </View>
            <View style={styles.etaWrap}>
              <Text style={styles.etaLabel}>ETA</Text>
              <Text style={styles.etaValue}>{formatEta(etaSeconds)}</Text>
            </View>
          </View>

          <View style={[styles.corridorBand, { borderColor: corridorColor }]}>
            <View style={[styles.corridorDot, { backgroundColor: corridorColor }, signalState === "GREEN" && shadows.greenGlow]} />
            <View style={styles.corridorBody}>
              <Text style={[styles.corridorTitle, { color: corridorColor }]}>{corridorLabel}</Text>
              <Text style={styles.corridorSubtitle}>
                {signalState === "GREEN"
                  ? "Proceed through the intersection without holding at red."
                  : "Stay on route. The backend is still tracking signal status and ambulance distance."}
              </Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <DataPill label="SEVERITY" value={activeCase.severity} />
            <DataPill label="DISTANCE" value={distanceM != null ? `${distanceM}m` : "--"} />
            <DataPill label="ROUTE" value={activeCase.ambulanceId ?? "AMB-001"} />
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

        {tab === "overview" ? (
          <View style={styles.panel}>
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Dispatch Summary</Text>
              <Text style={styles.blockValue}>{activeCase.complaint}</Text>
              <Text style={styles.blockBody}>
                The phone is now in live case mode. This view should stay open while the ambulance is en route so the
                driver always has the corridor state and patient context in one place.
              </Text>
            </View>

            <View style={styles.block}>
              <Text style={styles.blockLabel}>Transcript Feed</Text>
              <Text style={styles.blockBody}>{transcript || "Waiting for the paramedic transcript to arrive..."}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.panel}>
            {brief ? (
              <>
                <View style={styles.block}>
                  <Text style={styles.blockLabel}>Suspected Diagnosis</Text>
                  <Text style={[styles.blockValue, { color: colors.amber }]}>{String(brief.suspectedDiagnosis)}</Text>
                  <Text style={styles.blockBody}>{String(brief.chiefComplaint)}</Text>
                </View>

                <View style={styles.vitalsGrid}>
                  {([
                    ["BP", (brief.vitals as Record<string, unknown>).bp],
                    ["HR", (brief.vitals as Record<string, unknown>).hr],
                    ["SpO2", (brief.vitals as Record<string, unknown>).spo2],
                    ["GCS", (brief.vitals as Record<string, unknown>).gcs],
                  ] as Array<[string, unknown]>).map(([label, value]) => (
                    <View key={label} style={styles.vitalCard}>
                      <Text style={styles.vitalLabel}>{label}</Text>
                      <Text style={styles.vitalValue}>{value ? String(value) : "--"}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.block}>
                  <Text style={styles.blockLabel}>Prepare on Arrival</Text>
                  <View style={styles.resourcesWrap}>
                    {(brief.resources as unknown[]).map((resource, index) => (
                      <View key={`${String(resource)}-${index}`} style={styles.resourceBadge}>
                        <Text style={styles.resourceText}>{String(resource)}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.block}>
                  <Text style={styles.blockLabel}>Medication / Allergy Context</Text>
                  <Text style={styles.blockBody}>
                    Allergies: {String(brief.allergies)}
                    {"\n"}
                    Medications:{" "}
                    {Array.isArray(brief.medications)
                      ? (brief.medications as unknown[]).map(String).join(", ")
                      : String(brief.medications)}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.block}>
                <Text style={styles.blockLabel}>Brief Pipeline</Text>
                <Text style={styles.blockBody}>{transcript || "Medical brief has not arrived yet. Transcript will appear here first."}</Text>
              </View>
            )}

            <View style={styles.aiBadge}>
              <Text style={styles.aiText}>LIVE AI BRIEF · GEMMA MEDICAL SUMMARY</Text>
            </View>
          </View>
        )}
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
    paddingTop: 10,
    paddingBottom: 28,
  },
  heroCard: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: colors.border,
    borderTopColor: colors.cyan,
    backgroundColor: colors.card,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  heroEyebrow: {
    color: colors.cyan,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2.5,
  },
  heroTitle: {
    marginTop: 8,
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 28,
  },
  heroLocation: {
    marginTop: 4,
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 220,
  },
  etaWrap: {
    alignItems: "flex-end",
  },
  etaLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
  },
  etaValue: {
    marginTop: 6,
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 34,
  },
  corridorBand: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: colors.bg2,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  corridorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  corridorBody: {
    flex: 1,
  },
  corridorTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
  },
  corridorSubtitle: {
    marginTop: 6,
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 18,
  },
  dataRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  dataPill: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  dataPillLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  dataPillValue: {
    marginTop: 7,
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 14,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 18,
    marginBottom: 14,
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
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  panel: {
    gap: 14,
  },
  block: {
    padding: 16,
    borderRadius: 16,
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
    lineHeight: 26,
  },
  blockBody: {
    marginTop: 8,
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
    borderRadius: 14,
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
    borderRadius: 14,
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
