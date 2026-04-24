import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNav } from "@/src/components/BottomNav";
import { DotGridBackground } from "@/src/components/DotGridBackground";
import { GlassCard } from "@/src/components/GlassCard";
import { LiveDot } from "@/src/components/LiveDot";
import { MetricCard } from "@/src/components/MetricCard";
import { SectionLabel } from "@/src/components/SectionLabel";
import { BACKEND_IP } from "@/src/config";
import {
  useAppContext,
  type Language,
} from "@/src/context/AppContext";
import { usePolling } from "@/src/hooks/usePolling";
import { colors, typography } from "@/src/theme";

type LanguageOption = {
  code: Language;
  label: string;
};

const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिं" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

function signalAccent(state: "RED" | "GREEN"): string {
  return state === "GREEN" ? colors.green : colors.red;
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    driver,
    language,
    setLanguage,
    activeCase,
    signalState,
    isConnected,
  } = useAppContext();

  usePolling();

  // Auto-redirect removed so the Alert Screen can pop up first

  const firstName = driver?.name.split(" ")[0] ?? "Driver";
  const initial = driver?.name.charAt(0) ?? "D";
  const vehicle = driver?.vehicle ?? "—";
  const license = driver?.license ?? "—";

  const handleLanguagePress = useCallback(
    (code: Language) => {
      setLanguage(code);
    },
    [setLanguage],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <DotGridBackground />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello, {firstName}</Text>
            <Text style={styles.driverMeta}>
              {vehicle} · {license}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable hitSlop={8} style={styles.bellWrap}>
              <Feather
                name="bell"
                size={20}
                color={colors.textDim}
              />
            </Pressable>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitial}>{initial}</Text>
            </View>
          </View>
        </View>

        {/* STATUS CARD */}
        <GlassCard
          topBorderColor={colors.green}
          style={styles.statusCardOuter}
        >
          <LinearGradient
            colors={[
              "rgba(74,222,128,0.04)",
              "rgba(74,222,128,0)",
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <LiveDot color={colors.green} size={10} />
              <Text style={styles.statusLabel}>AVAILABLE</Text>
            </View>

            <View style={styles.signalIndicator}>
              <Text style={styles.signalLabel}>SIGNAL</Text>
              <View
                style={[
                  styles.signalBar,
                  {
                    backgroundColor: signalAccent(signalState),
                    shadowColor: signalAccent(signalState),
                  },
                ]}
              />
            </View>
          </View>

          <Text style={styles.statusSubtext}>
            Monitoring active · Dispatch alerts enabled
          </Text>

          <View style={styles.divider} />

          <View style={styles.connectionRow}>
            {isConnected ? (
              <>
                <View
                  style={[
                    styles.connectionDot,
                    { backgroundColor: colors.cyan },
                  ]}
                />
                <Text
                  style={[
                    styles.connectionText,
                    { color: colors.cyan },
                  ]}
                >
                  Connected to SmartEVP+
                </Text>
              </>
            ) : (
              <>
                <LiveDot color={colors.amber} size={6} />
                <Text
                  style={[
                    styles.connectionText,
                    { color: colors.amber },
                  ]}
                >
                  Reconnecting…
                </Text>
              </>
            )}
          </View>
        </GlassCard>

        {/* SHIFT STATS */}
        <View style={styles.statsRow}>
          <MetricCard
            label="Cases Today"
            value={3}
            color={colors.cyan}
          />
          <MetricCard
            label="Hours on Shift"
            value="4.5"
            unit="h"
            color={colors.amber}
          />
          <MetricCard
            label="Km Covered"
            value={38}
            color={colors.purple}
          />
        </View>

        {/* LAST DISPATCH */}
        <GlassCard topBorderColor={colors.amber}>
          <SectionLabel color={colors.amber}>LAST DISPATCH</SectionLabel>
          <View style={styles.emptyDispatch}>
            <Text style={styles.emptyDispatchText}>
              No dispatches this shift
            </Text>
          </View>
        </GlassCard>

        {/* SYSTEM STATUS */}
        <View style={styles.systemSection}>
          <SectionLabel>SYSTEM STATUS</SectionLabel>

          <View style={styles.systemList}>
            <View style={styles.systemRow}>
              <View style={styles.systemIconWrap}>
                <Feather
                  name="radio"
                  size={14}
                  color={colors.green}
                />
              </View>
              <Text style={styles.systemLabel}>GPS Signal</Text>
              <Text
                style={[styles.systemValue, { color: colors.green }]}
              >
                ACTIVE · 8 satellites
              </Text>
            </View>

            <View style={styles.systemRow}>
              <View style={styles.systemIconWrap}>
                <Feather
                  name="wifi"
                  size={14}
                  color={colors.cyan}
                />
              </View>
              <Text style={styles.systemLabel}>Backend</Text>
              <Text
                style={[styles.systemValue, { color: colors.cyan }]}
              >
                {BACKEND_IP}:8080
              </Text>
            </View>

            <View style={styles.systemRow}>
              <View style={styles.systemIconWrap}>
                <Feather
                  name="lock"
                  size={14}
                  color={colors.green}
                />
              </View>
              <Text style={styles.systemLabel}>Auth</Text>
              <Text
                style={[styles.systemValue, { color: colors.green }]}
              >
                ECC-256 Ready
              </Text>
            </View>
          </View>
        </View>

        {/* LANGUAGE TOGGLE */}
        <View style={styles.languageRow}>
          {LANGUAGES.map((option) => {
            const active = option.code === language;
            return (
              <Pressable
                key={option.code}
                onPress={() => handleLanguagePress(option.code)}
                style={[
                  styles.langPill,
                  active ? styles.langPillActive : styles.langPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.langPillText,
                    {
                      color: active ? colors.cyan : colors.textMuted,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* QUICK LINKS */}
        <View style={styles.quickLinks}>
          <Pressable
            onPress={() => router.push("/trip-history")}
            style={styles.quickLinkItem}
          >
            <Feather name="clock" size={14} color={colors.cyan} />
            <Text style={styles.quickLinkText}>Trip History</Text>
            <Feather
              name="chevron-right"
              size={14}
              color={colors.textMuted}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push("/active-case")}
            style={styles.quickLinkItem}
          >
            <Feather name="navigation" size={14} color={colors.green} />
            <Text style={styles.quickLinkText}>Open Active Dispatch</Text>
            <Feather
              name="chevron-right"
              size={14}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/profile")}
          style={styles.profileLinkWrap}
          hitSlop={6}
        >
          <Text style={styles.profileLink}>View Full Profile →</Text>
        </Pressable>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const PROFILE_SIZE = 44;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 84,
    gap: 18,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  greeting: {
    ...typography.headingL,
    color: colors.textPrimary,
  },
  driverMeta: {
    ...typography.labelM,
    color: colors.textMuted,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  profileCircle: {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
    borderRadius: PROFILE_SIZE / 2,
    backgroundColor: colors.cyanSoft,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    ...typography.headingM,
    color: colors.cyan,
  },

  // Status card
  statusCardOuter: {},
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusLabel: {
    ...typography.displayM,
    color: colors.green,
    letterSpacing: 1,
  },
  signalIndicator: {
    alignItems: "flex-end",
    gap: 4,
  },
  signalLabel: {
    ...typography.labelM,
    color: colors.textMuted,
  },
  signalBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  statusSubtext: {
    ...typography.bodyM,
    color: colors.textDim,
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginVertical: 14,
  },
  connectionRow: {
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
    ...typography.labelM,
    letterSpacing: 1,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },

  // Last dispatch
  emptyDispatch: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyDispatchText: {
    ...typography.bodyM,
    color: colors.textMuted,
  },

  // System status
  systemSection: {
    gap: 12,
  },
  systemList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  systemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorder,
  },
  systemIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg2,
  },
  systemLabel: {
    ...typography.bodyM,
    color: colors.textDim,
    flex: 1,
  },
  systemValue: {
    ...typography.labelM,
  },

  // Language toggle
  languageRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 4,
  },
  langPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 70,
    alignItems: "center",
  },
  langPillActive: {
    backgroundColor: colors.cyanSoft,
    borderColor: "rgba(34,211,238,0.4)",
  },
  langPillInactive: {
    backgroundColor: "transparent",
    borderColor: colors.glassBorder,
  },
  langPillText: {
    ...typography.labelM,
  },

  // Quick links
  quickLinks: {
    gap: 8,
    marginTop: 4,
  },
  quickLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  quickLinkText: {
    ...typography.bodyL,
    color: colors.textPrimary,
    flex: 1,
  },

  // Profile link
  profileLinkWrap: {
    alignItems: "center",
    paddingTop: 8,
  },
  profileLink: {
    ...typography.bodyM,
    color: colors.textMuted,
  },
});
