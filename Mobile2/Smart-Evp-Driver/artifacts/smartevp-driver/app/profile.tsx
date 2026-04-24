import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNav } from "@/src/components/BottomNav";
import { DotGridBackground } from "@/src/components/DotGridBackground";
import { GlassCard } from "@/src/components/GlassCard";
import { MetricCard } from "@/src/components/MetricCard";
import { SectionLabel } from "@/src/components/SectionLabel";
import { StatusBadge } from "@/src/components/StatusBadge";
import { BACKEND_IP } from "@/src/config";
import {
  useAppContext,
  type Language,
} from "@/src/context/AppContext";
import { colors, typography } from "@/src/theme";

type LanguageRow = {
  code: Language;
  label: string;
  native: string;
};

const LANGUAGES: LanguageRow[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
];

const SHIFT_STARTED_LABEL = "09:00 AM today";
const LAST_DISPATCH_LABEL = "2h 14m ago";

function formatHoursActive(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { driver, language, setLanguage, setDriver, setActiveCase } =
    useAppContext();

  // Shift started ~4h 32m ago when the screen mounts; ticks live.
  const shiftStartRef = useRef<number>(Date.now() - (4 * 60 + 32) * 60 * 1000);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const initial = driver?.name.charAt(0) ?? "D";
  const name = driver?.name ?? "Driver";
  const vehicle = driver?.vehicle ?? "—";
  const license = driver?.license ?? "—";
  const hoursActive = formatHoursActive(now - shiftStartRef.current);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useSharedValue(0);
  const toastTranslate = useSharedValue(-12);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      setToastMsg(msg);
      toastOpacity.value = withTiming(1, { duration: 200 });
      toastTranslate.value = withTiming(0, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
      });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => {
        toastOpacity.value = withTiming(0, { duration: 200 });
        toastTranslate.value = withTiming(-12, { duration: 220 });
        setTimeout(() => setToastMsg(null), 240);
      }, 1600);
    },
    [toastOpacity, toastTranslate],
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleLanguageSelect = useCallback(
    (row: LanguageRow) => {
      if (row.code === language) return;
      setLanguage(row.code);
      if (Platform.OS !== "web") {
        Haptics.selectionAsync().catch(() => undefined);
      }
      showToast(`Language updated to ${row.label}`);
    },
    [language, setLanguage, showToast],
  );

  const handleSwitchDriver = useCallback(() => {
    setActiveCase(null);
    setDriver(null);
    router.replace("/login");
  }, [router, setActiveCase, setDriver]);

  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastTranslate.value }],
  }));

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <DotGridBackground />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>DRIVER PROFILE</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Toast */}
      {toastMsg ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, toastStyle]}
        >
          <Feather name="check" size={14} color={colors.green} />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <Animated.View
          entering={FadeInDown.duration(380)}
          style={styles.hero}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.driverName}>{name}</Text>
          <Text style={styles.driverMeta}>
            {vehicle} · {license}
          </Text>
          <View style={styles.verifiedWrap}>
            <StatusBadge label="Verified Driver" color="green" />
          </View>
        </Animated.View>

        {/* TODAY'S PERFORMANCE */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(380)}
          style={styles.section}
        >
          <SectionLabel>TODAY&apos;S PERFORMANCE</SectionLabel>
          <View style={styles.metricRow}>
            <MetricCard
              label="Dispatches"
              value={3}
              color={colors.cyan}
            />
            <MetricCard
              label="Response Avg"
              value="3:45"
              unit="m"
              color={colors.green}
            />
            <MetricCard
              label="Distance"
              value={38}
              unit="km"
              color={colors.amber}
            />
          </View>
        </Animated.View>

        {/* CAREER TOTAL */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(380)}
          style={styles.section}
        >
          <SectionLabel>CAREER TOTAL</SectionLabel>
          <View style={styles.metricRow}>
            <MetricCard
              label="Total Cases"
              value={247}
              color={colors.cyan}
            />
            <MetricCard
              label="Km Driven"
              value="4,890"
              color={colors.amber}
            />
            <MetricCard
              label="Rating"
              value="4.9"
              color={colors.green}
              icon={
                <Feather name="star" size={12} color={colors.green} />
              }
            />
          </View>
        </Animated.View>

        {/* SHIFT INFO */}
        <Animated.View entering={FadeInDown.delay(240).duration(380)}>
          <GlassCard topBorderColor={colors.cyan}>
            <SectionLabel color={colors.cyan}>SHIFT INFO</SectionLabel>
            <ShiftRow
              icon="play-circle"
              label="Shift started"
              value={SHIFT_STARTED_LABEL}
            />
            <ShiftRow
              icon="clock"
              label="Hours active"
              value={hoursActive}
              valueColor={colors.green}
            />
            <ShiftRow
              icon="radio"
              label="Last dispatch"
              value={LAST_DISPATCH_LABEL}
              isLast
            />
          </GlassCard>
        </Animated.View>

        {/* LANGUAGE PREFERENCES */}
        <Animated.View
          entering={FadeInDown.delay(320).duration(380)}
          style={styles.section}
        >
          <SectionLabel>LANGUAGE</SectionLabel>
          <View style={styles.languageList}>
            {LANGUAGES.map((row) => {
              const active = row.code === language;
              return (
                <Pressable
                  key={row.code}
                  onPress={() => handleLanguageSelect(row)}
                  style={[
                    styles.langCard,
                    active ? styles.langCardActive : styles.langCardInactive,
                  ]}
                >
                  <View style={styles.langCardLeft}>
                    <Text
                      style={[
                        styles.langLabel,
                        {
                          color: active
                            ? colors.green
                            : colors.textPrimary,
                        },
                      ]}
                    >
                      {row.label}
                    </Text>
                    <Text style={styles.langNative}>{row.native}</Text>
                  </View>
                  {active ? (
                    <View style={styles.langCheck}>
                      <Feather
                        name="check"
                        size={16}
                        color={colors.green}
                      />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* SYSTEM */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(380)}
          style={styles.section}
        >
          <SectionLabel>SYSTEM</SectionLabel>
          <GlassCard>
            <SystemRow
              dotColor={colors.cyan}
              label="Connected to"
              value={`${BACKEND_IP}:8080`}
              valueColor={colors.cyan}
            />
            <SystemRow
              dotColor={colors.green}
              label="Signal Auth"
              value="ECC-256 Ready"
              valueColor={colors.green}
            />
            <SystemRow
              dotColor={colors.textMuted}
              label="App Version"
              value="1.0.0"
              valueColor={colors.textMuted}
            />
            <SystemRow
              dotColor={colors.green}
              label="GPS"
              value="Hardware ready"
              valueColor={colors.green}
              isLast
            />
          </GlassCard>
        </Animated.View>

        {/* FUTURE SCOPE */}
        <Animated.View entering={FadeInDown.delay(480).duration(380)}>
          <GlassCard topBorderColor={colors.purple}>
            <Text style={styles.comingLabel}>COMING SOON</Text>
            <Text style={styles.comingTitle}>
              Universal Pay Integration
            </Text>
            <Text style={styles.comingBody}>
              Verified dispatch hours automatically calculate compensation. No
              paperwork. No delays.
            </Text>
            <View style={styles.phaseBadge}>
              <Text style={styles.phaseBadgeText}>
                Phase 2 · Mid-Term Roadmap
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* SWITCH DRIVER */}
        <Animated.View
          entering={FadeInDown.delay(560).duration(380)}
          style={styles.switchWrap}
        >
          <Pressable onPress={handleSwitchDriver} hitSlop={8}>
            <Text style={styles.switchLink}>Switch Driver Profile</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

/* ============================================================
 * Pieces
 * ============================================================ */

type ShiftRowProps = {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
};

function ShiftRow({ icon, label, value, valueColor, isLast }: ShiftRowProps) {
  return (
    <View style={[styles.shiftRow, isLast && styles.shiftRowLast]}>
      <View style={styles.shiftIcon}>
        <Feather name={icon} size={14} color={colors.textDim} />
      </View>
      <Text style={styles.shiftLabel}>{label}</Text>
      <Text
        style={[
          styles.shiftValue,
          { color: valueColor ?? colors.textPrimary },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

type SystemRowProps = {
  dotColor: string;
  label: string;
  value: string;
  valueColor: string;
  isLast?: boolean;
};

function SystemRow({
  dotColor,
  label,
  value,
  valueColor,
  isLast,
}: SystemRowProps) {
  return (
    <View style={[styles.systemRow, isLast && styles.systemRowLast]}>
      <View style={[styles.systemDot, { backgroundColor: dotColor }]} />
      <Text style={styles.systemLabel}>{label}</Text>
      <Text style={[styles.systemValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

/* ============================================================
 * Styles
 * ============================================================ */

const AVATAR_SIZE = 88;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 84,
    gap: 18,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  headerTitle: {
    ...typography.headingL,
    color: colors.textPrimary,
    letterSpacing: 1,
  },

  // Toast
  toast: {
    position: "absolute",
    top: 64,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.4)",
    zIndex: 50,
  },
  toastText: {
    ...typography.labelM,
    color: colors.green,
  },

  // Hero
  hero: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.cyanSoft,
    borderWidth: 2,
    borderColor: colors.cyan,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.cyan,
    letterSpacing: -1,
  },
  driverName: {
    ...typography.displayM,
    color: colors.textPrimary,
    marginTop: 6,
  },
  driverMeta: {
    ...typography.labelM,
    color: colors.textMuted,
  },
  verifiedWrap: {
    marginTop: 6,
  },

  // Section wrapper
  section: {
    gap: 10,
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },

  // Shift card rows
  shiftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorder,
  },
  shiftRowLast: {
    borderBottomWidth: 0,
  },
  shiftIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.bg2,
    alignItems: "center",
    justifyContent: "center",
  },
  shiftLabel: {
    ...typography.bodyM,
    color: colors.textDim,
    flex: 1,
  },
  shiftValue: {
    ...typography.headingM,
    fontVariant: ["tabular-nums"],
  },

  // Language
  languageList: {
    gap: 8,
  },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  langCardActive: {
    backgroundColor: colors.greenSoft,
    borderColor: "rgba(74,222,128,0.5)",
  },
  langCardInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.glassBorder,
  },
  langCardLeft: {
    flex: 1,
    gap: 2,
  },
  langLabel: {
    ...typography.headingM,
  },
  langNative: {
    ...typography.bodyM,
    color: colors.textMuted,
  },
  langCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(74,222,128,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // System rows
  systemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorder,
  },
  systemRowLast: {
    borderBottomWidth: 0,
  },
  systemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  systemLabel: {
    ...typography.bodyM,
    color: colors.textDim,
    flex: 1,
  },
  systemValue: {
    ...typography.labelM,
  },

  // Coming soon
  comingLabel: {
    ...typography.labelM,
    color: colors.purple,
    marginBottom: 8,
  },
  comingTitle: {
    ...typography.headingL,
    color: colors.textPrimary,
  },
  comingBody: {
    ...typography.bodyL,
    color: colors.textDim,
    marginTop: 6,
  },
  phaseBadge: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.purpleSoft,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  phaseBadgeText: {
    ...typography.labelM,
    color: colors.purple,
  },

  // Switch
  switchWrap: {
    alignItems: "center",
    paddingTop: 4,
  },
  switchLink: {
    ...typography.bodyM,
    color: colors.textMuted,
    textDecorationLine: "underline",
  },
});
