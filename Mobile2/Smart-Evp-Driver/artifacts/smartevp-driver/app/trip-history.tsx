import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNav } from "@/src/components/BottomNav";
import { DotGridBackground } from "@/src/components/DotGridBackground";
import { GlassCard } from "@/src/components/GlassCard";
import { SectionLabel } from "@/src/components/SectionLabel";
import { colors, typography } from "@/src/theme";

type HospitalChoice = "own" | "map";

type Trip = {
  id: string;
  caseId: string;
  whenLabel: string;
  symptoms: string;
  location: string;
  hospitalChoice: HospitalChoice;
  hospitalName: string;
  durationMinutes: number;
};

const TRIPS: Trip[] = [
  {
    id: "T-2451",
    caseId: "CASE-2451",
    whenLabel: "Today · 14:32",
    symptoms: "Cardiac · chest pain",
    location: "MG Road, Bengaluru",
    hospitalChoice: "map",
    hospitalName: "Apollo · Bannerghatta",
    durationMinutes: 9,
  },
  {
    id: "T-2447",
    caseId: "CASE-2447",
    whenLabel: "Today · 09:14",
    symptoms: "Trauma · road accident",
    location: "Outer Ring Road",
    hospitalChoice: "own",
    hospitalName: "Manipal · Old Airport Rd",
    durationMinutes: 12,
  },
  {
    id: "T-2438",
    caseId: "CASE-2438",
    whenLabel: "Yesterday · 22:08",
    symptoms: "Respiratory distress",
    location: "Indiranagar 100ft Rd",
    hospitalChoice: "map",
    hospitalName: "Fortis · Cunningham",
    durationMinutes: 7,
  },
  {
    id: "T-2431",
    caseId: "CASE-2431",
    whenLabel: "Yesterday · 16:41",
    symptoms: "Stroke · slurred speech",
    location: "HSR Layout Sector 6",
    hospitalChoice: "map",
    hospitalName: "Apollo · Bannerghatta",
    durationMinutes: 11,
  },
  {
    id: "T-2429",
    caseId: "CASE-2429",
    whenLabel: "Apr 22 · 11:55",
    symptoms: "Maternity · labor",
    location: "Koramangala 5th Block",
    hospitalChoice: "own",
    hospitalName: "Manipal · Old Airport Rd",
    durationMinutes: 14,
  },
  {
    id: "T-2421",
    caseId: "CASE-2421",
    whenLabel: "Apr 22 · 04:12",
    symptoms: "Cardiac · syncope",
    location: "Whitefield Main Rd",
    hospitalChoice: "map",
    hospitalName: "Columbia Asia · Whitefield",
    durationMinutes: 6,
  },
  {
    id: "T-2415",
    caseId: "CASE-2415",
    whenLabel: "Apr 21 · 19:30",
    symptoms: "Trauma · fall from height",
    location: "Bellandur Junction",
    hospitalChoice: "own",
    hospitalName: "Manipal · Old Airport Rd",
    durationMinutes: 13,
  },
  {
    id: "T-2410",
    caseId: "CASE-2410",
    whenLabel: "Apr 21 · 08:02",
    symptoms: "Pediatric · seizure",
    location: "Jayanagar 4th Block",
    hospitalChoice: "map",
    hospitalName: "Rainbow · Bannerghatta",
    durationMinutes: 10,
  },
  {
    id: "T-2402",
    caseId: "CASE-2402",
    whenLabel: "Apr 20 · 23:48",
    symptoms: "Burns · domestic accident",
    location: "Banashankari 3rd Stage",
    hospitalChoice: "map",
    hospitalName: "Apollo · Jayanagar",
    durationMinutes: 8,
  },
  {
    id: "T-2398",
    caseId: "CASE-2398",
    whenLabel: "Apr 20 · 13:21",
    symptoms: "Cardiac · chest pain",
    location: "Marathahalli Bridge",
    hospitalChoice: "own",
    hospitalName: "Manipal · Old Airport Rd",
    durationMinutes: 11,
  },
];

export default function TripHistoryScreen() {
  const router = useRouter();

  const stats = useMemo(() => {
    const total = TRIPS.length;
    const own = TRIPS.filter((t) => t.hospitalChoice === "own").length;
    const map = total - own;
    const ownPct = total > 0 ? Math.round((own / total) * 100) : 0;
    const mapPct = total > 0 ? 100 - ownPct : 0;
    return { total, own, map, ownPct, mapPct };
  }, []);

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
        <View style={styles.headerCenter}>
          <Text style={styles.eyebrow}>03 — DRIVER LOG</Text>
          <Text style={styles.title}>Trip History</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <ChoiceStatCard
            label="Driver's Hospital"
            sub="Picked by you"
            count={stats.own}
            pct={stats.ownPct}
            accent={colors.cyan}
            soft={colors.cyanSoft}
            icon="user"
          />
          <ChoiceStatCard
            label="Map's Hospital"
            sub="Routed by SmartEVP+"
            count={stats.map}
            pct={stats.mapPct}
            accent={colors.green}
            soft={colors.greenSoft}
            icon="navigation"
          />
        </View>

        {/* Comparison bar */}
        <GlassCard>
          <SectionLabel>HOSPITAL CHOICE BREAKDOWN</SectionLabel>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barSegment,
                {
                  flex: stats.own || 0.0001,
                  backgroundColor: colors.cyan,
                },
              ]}
            />
            <View
              style={[
                styles.barSegment,
                {
                  flex: stats.map || 0.0001,
                  backgroundColor: colors.green,
                },
              ]}
            />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.cyan }]}
              />
              <Text style={styles.legendText}>
                Driver {stats.ownPct}%
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.green }]}
              />
              <Text style={styles.legendText}>Map {stats.mapPct}%</Text>
            </View>
            <Text style={styles.legendTotal}>
              {stats.total} trips logged
            </Text>
          </View>
        </GlassCard>

        {/* Recent trips list */}
        <View style={styles.listSection}>
          <SectionLabel>RECENT TRIPS</SectionLabel>
          <View style={styles.list}>
            {TRIPS.map((trip, idx) => (
              <Animated.View
                key={trip.id}
                entering={FadeInDown.delay(idx * 40)
                  .duration(280)
                  .easing(Easing.out(Easing.cubic))}
              >
                <TripRow trip={trip} />
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Showing last {TRIPS.length} dispatches · synced{" "}
            {new Date().toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

/* ============================================================
 * Pieces
 * ============================================================ */

type ChoiceStatCardProps = {
  label: string;
  sub: string;
  count: number;
  pct: number;
  accent: string;
  soft: string;
  icon: React.ComponentProps<typeof Feather>["name"];
};

function ChoiceStatCard({
  label,
  sub,
  count,
  pct,
  accent,
  soft,
  icon,
}: ChoiceStatCardProps) {
  return (
    <GlassCard topBorderColor={accent} style={styles.choiceCard}>
      <View style={styles.choiceHeader}>
        <View style={[styles.choiceIcon, { backgroundColor: soft }]}>
          <Feather name={icon} size={14} color={accent} />
        </View>
        <Text style={styles.choicePct}>
          <Text style={[styles.choicePctValue, { color: accent }]}>{pct}</Text>
          <Text style={styles.choicePctSign}>%</Text>
        </Text>
      </View>
      <Text style={[styles.choiceCount, { color: accent }]}>{count}</Text>
      <Text style={styles.choiceLabel}>{label}</Text>
      <Text style={styles.choiceSub}>{sub}</Text>
    </GlassCard>
  );
}

function TripRow({ trip }: { trip: Trip }) {
  const isOwn = trip.hospitalChoice === "own";
  const accent = isOwn ? colors.cyan : colors.green;
  const soft = isOwn ? colors.cyanSoft : colors.greenSoft;
  const choiceLabel = isOwn ? "DRIVER" : "MAP";

  return (
    <View style={styles.tripRow}>
      <View style={[styles.tripAccent, { backgroundColor: accent }]} />
      <View style={styles.tripBody}>
        <View style={styles.tripTopRow}>
          <Text style={styles.tripCaseId}>{trip.caseId}</Text>
          <Text style={styles.tripWhen}>{trip.whenLabel}</Text>
        </View>
        <Text style={styles.tripSymptoms}>{trip.symptoms}</Text>
        <View style={styles.tripBottomRow}>
          <View style={styles.tripLocationRow}>
            <Feather
              name="map-pin"
              size={11}
              color={colors.textMuted}
            />
            <Text style={styles.tripLocation} numberOfLines={1}>
              {trip.location}
            </Text>
          </View>
          <Text style={styles.tripDuration}>{trip.durationMinutes}m</Text>
        </View>
        <View style={styles.tripHospRow}>
          <View
            style={[
              styles.tripChoiceBadge,
              {
                backgroundColor: soft,
                borderColor: accent,
              },
            ]}
          >
            <Text style={[styles.tripChoiceBadgeText, { color: accent }]}>
              {choiceLabel}
            </Text>
          </View>
          <Text style={styles.tripHospName} numberOfLines={1}>
            {trip.hospitalName}
          </Text>
        </View>
      </View>
    </View>
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
  headerCenter: {
    alignItems: "center",
    gap: 2,
  },
  eyebrow: {
    ...typography.labelM,
    color: colors.textMuted,
  },
  title: {
    ...typography.headingL,
    color: colors.textPrimary,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 84,
    gap: 16,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  choiceCard: {
    flex: 1,
  },
  choiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  choiceIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  choicePct: {
    ...typography.bodyM,
    color: colors.textMuted,
  },
  choicePctValue: {
    ...typography.headingM,
  },
  choicePctSign: {
    color: colors.textMuted,
  },
  choiceCount: {
    ...typography.displayL,
    fontVariant: ["tabular-nums"],
  },
  choiceLabel: {
    ...typography.headingM,
    color: colors.textPrimary,
    marginTop: 2,
  },
  choiceSub: {
    ...typography.labelM,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Comparison bar
  barTrack: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 10,
    backgroundColor: colors.bg2,
  },
  barSegment: {
    height: "100%",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.labelM,
    color: colors.textDim,
  },
  legendTotal: {
    ...typography.labelM,
    color: colors.textMuted,
    marginLeft: "auto",
  },

  // List
  listSection: {
    gap: 10,
  },
  list: {
    gap: 8,
  },
  tripRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    overflow: "hidden",
  },
  tripAccent: {
    width: 3,
  },
  tripBody: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  tripTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripCaseId: {
    ...typography.headingM,
    color: colors.textPrimary,
  },
  tripWhen: {
    ...typography.labelM,
    color: colors.textMuted,
  },
  tripSymptoms: {
    ...typography.bodyM,
    color: colors.textDim,
  },
  tripBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  tripLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  tripLocation: {
    ...typography.labelM,
    color: colors.textMuted,
    flex: 1,
  },
  tripDuration: {
    ...typography.labelM,
    color: colors.textDim,
    fontVariant: ["tabular-nums"],
  },
  tripHospRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  tripChoiceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  tripChoiceBadgeText: {
    ...typography.labelM,
    fontSize: 9,
  },
  tripHospName: {
    ...typography.bodyM,
    color: colors.textDim,
    flex: 1,
  },

  footer: {
    alignItems: "center",
    paddingTop: 8,
  },
  footerText: {
    ...typography.labelM,
    color: colors.textMuted,
  },
});
