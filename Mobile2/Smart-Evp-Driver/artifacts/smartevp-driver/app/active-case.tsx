import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";

import { GlassCard } from "@/src/components/GlassCard";
import { LiveDot } from "@/src/components/LiveDot";
import { PulsingRing } from "@/src/components/PulsingRing";
import { SectionLabel } from "@/src/components/SectionLabel";
import { SignalStrip } from "@/src/components/SignalStrip";
import { EtaRing } from "@/src/components/EtaRing";
import {
  useAppContext,
  type ActiveCase,
  type CaseSeverity,
  type MedicalBrief,
} from "@/src/context/AppContext";
import { colors, typography } from "@/src/theme";

type TabKey = "CASE" | "BRIEF" | "MAP";

const TABS: TabKey[] = ["CASE", "BRIEF", "MAP"];

const MOCK_CASE: ActiveCase = {
  id: "CASE-2451",
  intersection: "INT-01",
  distanceMeters: 280,
  location: "MG Road & Brigade Cross, Bengaluru",
  symptoms: "Chest pain, shortness of breath, age 58 male",
  severity: "critical",
  driverHospital: "Manipal Hospital — Old Airport Rd",
  mapHospital: "Apollo Hospital — Bannerghatta",
  hospitalChosen: "map",
  dispatchedAt: Date.now(),
  etaTotalSeconds: 540,
  etaSecondsRemaining: 540,
  latencyMs: 38,
};

const MOCK_BRIEF: MedicalBrief = {
  patient: { name: "M. Anand", age: 58, sex: "M" },
  chiefComplaint:
    "Sudden onset crushing chest pain radiating to left arm, diaphoretic.",
  suspectedDiagnosis: "Acute myocardial infarction (STEMI suspected)",
  vitals: {
    bp: "92/58",
    hr: "118",
    spo2: "91%",
    gcs: "14",
  },
  resources: ["Cardiologist", "Cath Lab", "Defib", "ICU Bed"],
  medications: ["Aspirin 75mg PRN", "Metoprolol 50mg"],
  allergies: ["Penicillin"],
};

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function severityPalette(sev: CaseSeverity): {
  color: string;
  label: string;
} {
  switch (sev) {
    case "critical":
      return { color: colors.red, label: "CRITICAL" };
    case "serious":
      return { color: colors.amber, label: "SERIOUS" };
    case "stable":
    default:
      return { color: colors.green, label: "STABLE" };
  }
}

export default function ActiveCaseScreen() {
  const router = useRouter();
  const {
    driver,
    activeCase,
    setActiveCase,
    signalState,
    setSignalState,
    medicalBrief,
    setMedicalBrief,
  } = useAppContext();

  const [tab, setTab] = useState<TabKey>("CASE");
  const [now, setNow] = useState<number>(Date.now());
  const seededRef = useRef(false);

  // Seed mock data on first mount so the screen always renders meaningfully
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (!activeCase) {
      setActiveCase({ ...MOCK_CASE, dispatchedAt: Date.now() });
    }
    setSignalState("RED");
    setMedicalBrief(null);
    const briefTimer = setTimeout(() => {
      setMedicalBrief(MOCK_BRIEF);
    }, 4200);
    const greenTimer = setTimeout(() => {
      setSignalState("GREEN");
    }, 6500);
    return () => {
      clearTimeout(briefTimer);
      clearTimeout(greenTimer);
    };
  }, [activeCase, setActiveCase, setMedicalBrief, setSignalState]);

  // Tick the clock every second for elapsed time
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Decrement ETA every 2 seconds (stand-in for /api/eta polling)
  useEffect(() => {
    const id = setInterval(() => {
      setActiveCase(
        activeCase
          ? {
              ...activeCase,
              etaSecondsRemaining: Math.max(
                0,
                activeCase.etaSecondsRemaining - 2,
              ),
            }
          : activeCase,
      );
    }, 2000);
    return () => clearInterval(id);
  }, [activeCase, setActiveCase]);

  const caseData = activeCase ?? MOCK_CASE;
  const elapsedMs = now - caseData.dispatchedAt;
  const sev = severityPalette(caseData.severity);

  const handleMarkArrived = useCallback(() => {
    Alert.alert(
      "Mark as arrived?",
      "Confirm the ambulance has reached the hospital. This will close the active dispatch.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              ).catch(() => undefined);
            }
            setActiveCase(null);
            setMedicalBrief(null);
            setSignalState("RED");
            router.replace("/case-complete");
          },
        },
      ],
    );
  }, [router, setActiveCase, setMedicalBrief, setSignalState]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.vehicle}>
            <Feather name="truck" size={16} color={colors.textPrimary} />{" "}
            {driver?.vehicle ?? "AMB-001"}
          </Text>
          <View style={styles.enRouteRow}>
            <LiveDot color={colors.green} size={6} />
            <Text style={styles.enRouteText}>EN ROUTE</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.caseBadge}>
            <Text style={styles.caseBadgeText}>{caseData.id}</Text>
          </View>
          <Text style={styles.elapsedText}>{formatElapsed(elapsedMs)}</Text>
        </View>
      </View>

      <SignalStrip state={signalState} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SignalCorridorPanel
          state={signalState}
          intersection={caseData.intersection}
          distanceMeters={caseData.distanceMeters}
          latencyMs={caseData.latencyMs ?? 38}
        />

        <TabBar
          active={tab}
          onChange={setTab}
          briefAvailable={medicalBrief !== null}
        />

        {tab === "CASE" ? (
          <CaseTabContent
            caseData={caseData}
            elapsedMs={elapsedMs}
            briefAvailable={medicalBrief !== null}
            severity={sev}
          />
        ) : null}

        {tab === "BRIEF" ? (
          <BriefTabContent brief={medicalBrief} severity={sev} />
        ) : null}

        {tab === "MAP" ? <MapTabContent /> : null}
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={styles.actionBar}>
        <Pressable onPress={handleMarkArrived} style={styles.actionButton}>
          <Feather name="check-circle" size={18} color={colors.bg} />
          <Text style={styles.actionButtonText}>ON SCENE — Mark Arrived</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ============================================================
 * Signal Corridor Panel
 * ============================================================ */

type SignalCorridorPanelProps = {
  state: "RED" | "GREEN";
  intersection: string;
  distanceMeters: number;
  latencyMs: number;
};

const PANEL_HEIGHT = 132;

function SignalCorridorPanel({
  state,
  intersection,
  distanceMeters,
  latencyMs,
}: SignalCorridorPanelProps) {
  const wave = useSharedValue(PANEL_HEIGHT);
  const glow = useSharedValue(0);
  const circlePulse = useSharedValue(1);

  useEffect(() => {
    if (state === "GREEN") {
      wave.value = PANEL_HEIGHT;
      wave.value = withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      glow.value = withTiming(1, { duration: 600 });
      circlePulse.value = withSequence(
        withTiming(1.15, { duration: 220 }),
        withTiming(1, { duration: 280 }),
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
      }
    } else {
      wave.value = withTiming(PANEL_HEIGHT, { duration: 320 });
      glow.value = withTiming(0, { duration: 320 });
    }
  }, [state, wave, glow, circlePulse]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: wave.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circlePulse.value }],
  }));

  const accent = state === "GREEN" ? colors.green : colors.red;

  return (
    <GlassCard topBorderColor={accent} style={styles.panelOuter}>
      {/* RED inner glow (always faintly visible when RED) */}
      {state === "RED" ? (
        <View style={styles.redGlowBackdrop} pointerEvents="none" />
      ) : null}

      {/* Animated GREEN wave sweep + glow */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, waveStyle]}
      >
        <LinearGradient
          colors={["transparent", "rgba(74,222,128,0.30)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.greenGlowBackdrop, glowStyle]}
      />

      <View style={styles.panelRow}>
        <Animated.View style={circleStyle}>
          <View
            style={[
              styles.signalCircle,
              {
                backgroundColor: accent,
                shadowColor: accent,
                shadowOpacity: state === "GREEN" ? 0.9 : 0.5,
                shadowRadius: state === "GREEN" ? 16 : 10,
              },
            ]}
          >
            <Feather
              name={state === "GREEN" ? "navigation" : "alert-triangle"}
              size={20}
              color={colors.bg}
            />
          </View>
        </Animated.View>

        <View style={styles.panelText}>
          {state === "GREEN" ? (
            <>
              <Text style={styles.greenTitle}>GREEN CORRIDOR — PROCEED</Text>
              <Text style={styles.panelSub}>
                {intersection} · Authenticated · {latencyMs}ms · ECC-256{" "}
                <Feather name="check" size={11} color={colors.green} />
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.redTitle}>
                {intersection} · APPROACHING
              </Text>
              <Text style={styles.panelSub}>
                {distanceMeters}m to intersection · awaiting authentication
              </Text>
            </>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

/* ============================================================
 * Tab Bar
 * ============================================================ */

type TabBarProps = {
  active: TabKey;
  onChange: (k: TabKey) => void;
  briefAvailable: boolean;
};

function TabBar({ active, onChange, briefAvailable }: TabBarProps) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={styles.tabItem}
          >
            <View style={styles.tabLabelRow}>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.textPrimary : colors.textMuted,
                  },
                ]}
              >
                {tab}
              </Text>
              {tab === "BRIEF" && briefAvailable ? (
                <View style={styles.tabDot} />
              ) : null}
            </View>
            {isActive ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ============================================================
 * CASE Tab
 * ============================================================ */

type CaseTabContentProps = {
  caseData: ActiveCase;
  elapsedMs: number;
  briefAvailable: boolean;
  severity: { color: string; label: string };
};

function CaseTabContent({
  caseData,
  elapsedMs,
  briefAvailable,
  severity,
}: CaseTabContentProps) {
  return (
    <Animated.View entering={FadeIn.duration(220)}>
      <GlassCard topBorderColor={severity.color}>
        <View style={styles.caseHeader}>
          <Text style={styles.caseId}>{caseData.id}</Text>
          <View
            style={[
              styles.severityBadge,
              { borderColor: severity.color },
            ]}
          >
            <Text
              style={[
                styles.severityBadgeText,
                { color: severity.color },
              ]}
            >
              {severity.label}
            </Text>
          </View>
        </View>

        <View style={styles.caseRow}>
          <Feather name="map-pin" size={14} color={colors.textDim} />
          <Text style={styles.caseRowText}>{caseData.location}</Text>
        </View>

        <View style={styles.caseRow}>
          <Feather name="activity" size={14} color={colors.textDim} />
          <Text style={styles.caseRowText}>{caseData.symptoms}</Text>
        </View>

        <View style={styles.caseRow}>
          <Feather name="clock" size={14} color={colors.textDim} />
          <Text style={styles.caseRowText}>
            Dispatched {formatElapsed(elapsedMs)} ago
          </Text>
        </View>

        <View style={styles.etaWrap}>
          <EtaRing
            totalSeconds={caseData.etaTotalSeconds}
            remainingSeconds={caseData.etaSecondsRemaining}
            size={132}
          />
        </View>

        <View style={styles.briefStatusRow}>
          {briefAvailable ? (
            <>
              <LiveDot color={colors.green} size={6} />
              <Text
                style={[styles.briefStatusText, { color: colors.green }]}
              >
                Hospital notified · Resources pre-allocated
              </Text>
            </>
          ) : (
            <>
              <LiveDot color={colors.amber} size={6} />
              <Text
                style={[styles.briefStatusText, { color: colors.amber }]}
              >
                Brief generating…
              </Text>
            </>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

/* ============================================================
 * BRIEF Tab
 * ============================================================ */

type BriefTabContentProps = {
  brief: MedicalBrief | null;
  severity: { color: string; label: string };
};

function BriefTabContent({ brief, severity }: BriefTabContentProps) {
  if (!brief) {
    return (
      <Animated.View entering={FadeIn.duration(220)} style={styles.briefEmpty}>
        <PulsingRing color={colors.purple} size={80} />
        <Text style={styles.briefEmptyTitle}>Generating patient brief…</Text>
        <View style={styles.briefEmptyRow}>
          <LiveDot color={colors.purple} size={6} />
          <Text style={styles.briefEmptyMeta}>
            Gemma AI analyzing nurse audio
          </Text>
        </View>
      </Animated.View>
    );
  }

  const { patient, chiefComplaint, suspectedDiagnosis, vitals, resources, medications, allergies } = brief;

  return (
    <Animated.View entering={SlideInRight.duration(360)}>
      <GlassCard style={styles.wristband}>
        {/* Top severity band */}
        <View
          style={[
            styles.wristbandBand,
            { backgroundColor: severity.color },
          ]}
        >
          <Text style={styles.wristbandSeverity}>{severity.label}</Text>
          <Text style={styles.wristbandPatient}>
            {patient.name} · {patient.age}
            {patient.sex.toLowerCase()}
          </Text>
        </View>

        <View style={styles.wristbandBody}>
          <Animated.View entering={FadeInDown.delay(0).duration(280)}>
            <View
              style={[
                styles.briefSection,
                styles.briefSectionRedBorder,
              ]}
            >
              <SectionLabel color={colors.red}>CHIEF COMPLAINT</SectionLabel>
              <Text style={styles.briefBody}>{chiefComplaint}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(280)}>
            <View style={styles.briefSection}>
              <SectionLabel color={colors.amber}>
                SUSPECTED DIAGNOSIS
              </SectionLabel>
              <Text
                style={[styles.briefBody, { color: colors.amber }]}
              >
                {suspectedDiagnosis}
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(280)}>
            <View style={styles.briefSection}>
              <SectionLabel>VITALS</SectionLabel>
              <View style={styles.vitalsGrid}>
                <VitalCell label="BP" value={vitals.bp} />
                <VitalCell label="HR" value={vitals.hr} />
                <VitalCell label="SpO2" value={vitals.spo2} />
                <VitalCell label="GCS" value={vitals.gcs} />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).duration(280)}>
            <View style={styles.briefSection}>
              <SectionLabel color={colors.green}>RESOURCES</SectionLabel>
              <View style={styles.resourceRow}>
                {resources.map((r) => (
                  <View key={r} style={styles.resourcePill}>
                    <Feather
                      name="check"
                      size={11}
                      color={colors.green}
                    />
                    <Text style={styles.resourcePillText}>{r}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(320).duration(280)}>
            <View style={styles.briefSection}>
              <View style={styles.medAllergyRow}>
                <View style={styles.medAllergyCol}>
                  <SectionLabel>MEDICATIONS</SectionLabel>
                  {medications.map((m) => (
                    <Text key={m} style={styles.medText}>
                      • {m}
                    </Text>
                  ))}
                </View>
                <View style={styles.medAllergyCol}>
                  <SectionLabel color={colors.red}>ALLERGIES</SectionLabel>
                  {allergies.map((a) => (
                    <Text
                      key={a}
                      style={[styles.medText, { color: colors.red }]}
                    >
                      • {a}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(280)}
            style={styles.aiStamp}
          >
            <View
              style={[
                styles.aiStampDot,
                { backgroundColor: colors.purple },
              ]}
            />
            <Text style={styles.aiStampText}>
              AI GENERATED · GEMMA 2B · ON-DEVICE
            </Text>
          </Animated.View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function VitalCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.vitalCell}>
      <Text style={styles.vitalLabel}>{label}</Text>
      <Text style={styles.vitalValue}>{value}</Text>
    </View>
  );
}

/* ============================================================
 * MAP Tab (placeholder)
 * ============================================================ */

function MapTabContent() {
  return (
    <Animated.View entering={FadeIn.duration(220)}>
      <GlassCard style={styles.mapPlaceholder}>
        <View style={styles.mapGridWrap} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern
                id="map-grid"
                width={28}
                height={28}
                patternUnits="userSpaceOnUse"
              >
                <Line
                  x1={0}
                  y1={0}
                  x2={28}
                  y2={0}
                  stroke={colors.glassBorder}
                  strokeWidth={1}
                />
                <Line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={28}
                  stroke={colors.glassBorder}
                  strokeWidth={1}
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#map-grid)" />
          </Svg>
        </View>
        <Feather name="map" size={28} color={colors.textMuted} />
        <Text style={styles.mapPlaceholderText}>
          Live map coming in production build
        </Text>
      </GlassCard>
    </Animated.View>
  );
}

/* ============================================================
 * Styles
 * ============================================================ */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    gap: 4,
  },
  vehicle: {
    ...typography.headingM,
    color: colors.textPrimary,
  },
  enRouteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  enRouteText: {
    ...typography.labelM,
    color: colors.green,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  caseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.4)",
  },
  caseBadgeText: {
    ...typography.labelM,
    color: colors.amber,
  },
  elapsedText: {
    ...typography.bodyM,
    color: colors.textDim,
    fontVariant: ["tabular-nums"],
  },

  // Panel
  panelOuter: {
    minHeight: PANEL_HEIGHT,
    overflow: "hidden",
  },
  panelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 88,
  },
  redGlowBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.red,
    opacity: 0.05,
  },
  greenGlowBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.green,
    opacity: 0.06,
  },
  signalCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
  },
  panelText: {
    flex: 1,
    gap: 4,
  },
  redTitle: {
    ...typography.headingL,
    color: colors.red,
  },
  greenTitle: {
    ...typography.displayM,
    color: colors.green,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  panelSub: {
    ...typography.bodyM,
    color: colors.textDim,
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabLabel: {
    ...typography.labelL,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.purple,
  },
  tabUnderline: {
    position: "absolute",
    bottom: -1,
    height: 2,
    width: "60%",
    backgroundColor: colors.red,
  },

  // Case tab
  caseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  caseId: {
    ...typography.headingL,
    color: colors.textPrimary,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  severityBadgeText: {
    ...typography.labelM,
  },
  caseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 5,
  },
  caseRowText: {
    ...typography.bodyM,
    color: colors.textDim,
    flex: 1,
  },
  etaWrap: {
    alignItems: "center",
    paddingVertical: 14,
  },
  briefStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    marginTop: 4,
    paddingTop: 12,
  },
  briefStatusText: {
    ...typography.labelM,
  },

  // Brief - empty
  briefEmpty: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 18,
  },
  briefEmptyTitle: {
    ...typography.bodyM,
    color: colors.textMuted,
  },
  briefEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  briefEmptyMeta: {
    ...typography.labelM,
    color: colors.purple,
  },

  // Brief - filled (wristband)
  wristband: {
    padding: 0,
  },
  wristbandBand: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wristbandSeverity: {
    ...typography.labelL,
    color: colors.bg,
  },
  wristbandPatient: {
    ...typography.headingM,
    color: colors.bg,
  },
  wristbandBody: {
    padding: 14,
    gap: 14,
  },
  briefSection: {
    gap: 6,
  },
  briefSectionRedBorder: {
    borderLeftWidth: 2,
    borderLeftColor: colors.red,
    paddingLeft: 10,
  },
  briefBody: {
    ...typography.bodyL,
    color: colors.textPrimary,
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  vitalCell: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 2,
  },
  vitalLabel: {
    ...typography.labelM,
    color: colors.textMuted,
  },
  vitalValue: {
    ...typography.headingL,
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  resourceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  resourcePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  resourcePillText: {
    ...typography.labelM,
    color: colors.green,
  },
  medAllergyRow: {
    flexDirection: "row",
    gap: 14,
  },
  medAllergyCol: {
    flex: 1,
    gap: 4,
  },
  medText: {
    ...typography.bodyM,
    color: colors.textDim,
  },
  aiStamp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  aiStampDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  aiStampText: {
    ...typography.labelM,
    color: colors.purple,
  },

  // Map placeholder
  mapPlaceholder: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    overflow: "hidden",
  },
  mapGridWrap: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  mapPlaceholderText: {
    ...typography.bodyM,
    color: colors.textMuted,
  },

  // Action bar
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: "rgba(5,8,16,0.92)",
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.green,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtonText: {
    ...typography.headingM,
    color: colors.bg,
    letterSpacing: 0.5,
  },
});
