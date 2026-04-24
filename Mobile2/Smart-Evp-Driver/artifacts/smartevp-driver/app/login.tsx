import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassCard } from "@/src/components/GlassCard";
import { StatusBadge } from "@/src/components/StatusBadge";
import { useAppContext, type Driver } from "@/src/context/AppContext";
import { colors, typography } from "@/src/theme";

const DRIVERS: Driver[] = [
  {
    id: "D001",
    name: "Rishikesh Kanavi",
    vehicle: "AMB-001",
    license: "KA-01-AB-1234",
  },
  {
    id: "D002",
    name: "Sachin Raj",
    vehicle: "AMB-002",
    license: "KA-02-CD-5678",
  },
];

type DriverCardProps = {
  driver: Driver;
  index: number;
  onSelect: (driver: Driver) => void;
};

function DriverCard({ driver, index, onSelect }: DriverCardProps) {
  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
    onSelect(driver);
  }, [driver, onSelect]);

  return (
    <View>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          {
            transform: [{ scale: pressed ? 0.97 : 1 }],
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <GlassCard topBorderColor={colors.cyan}>
          <View style={styles.cardRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{driver.name.charAt(0)}</Text>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.driverMeta}>
                {driver.vehicle} · {driver.license}
              </Text>
              <View style={styles.badgeWrap}>
                <StatusBadge label="Available" color="green" />
              </View>
            </View>

            <View style={styles.chevronWrap}>
              <Feather
                name="chevron-right"
                size={22}
                color={colors.textMuted}
              />
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { setDriver } = useAppContext();

  const handleSelect = useCallback(
    (driver: Driver) => {
      setDriver(driver);
      router.replace("/home");
    },
    [router, setDriver],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>01 — CREW SELECTION</Text>
          <Text style={styles.heading}>{"Select Your\nProfile"}</Text>
          <Text style={styles.subtext}>
            SmartEVP+ will route all dispatch alerts to your device
          </Text>
        </View>

        <View style={styles.list}>
          {DRIVERS.map((driver, index) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              index={index}
              onSelect={handleSelect}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            SmartEVP+ · Team V4 · Celestia
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 56;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  header: {
    gap: 12,
    marginTop: 12,
    marginBottom: 32,
  },
  eyebrow: {
    ...typography.labelL,
    color: colors.cyan,
  },
  heading: {
    ...typography.displayL,
    color: colors.textPrimary,
    lineHeight: 38,
  },
  subtext: {
    ...typography.bodyM,
    color: colors.textDim,
    marginTop: 2,
  },
  list: {
    gap: 14,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.cyanSoft,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...typography.displayM,
    color: colors.cyan,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  driverName: {
    ...typography.headingM,
    color: colors.textPrimary,
  },
  driverMeta: {
    ...typography.labelM,
    color: colors.textMuted,
  },
  badgeWrap: {
    marginTop: 6,
  },
  chevronWrap: {
    paddingLeft: 4,
  },
  footer: {
    marginTop: "auto",
    paddingVertical: 16,
    alignItems: "center",
  },
  footerText: {
    ...typography.labelM,
    color: colors.textMuted,
  },
});
