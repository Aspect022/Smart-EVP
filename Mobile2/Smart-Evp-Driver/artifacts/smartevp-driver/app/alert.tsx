import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAppContext } from "@/src/context/AppContext";
import { colors, typography } from "@/src/theme";
import { BACKEND_URL } from "@/src/config";

export default function AlertScreen() {
  const router = useRouter();
  const { driver, activeCase } = useAppContext();
  const [accepting, setAccepting] = useState(false);

  // Fallback case for demo
  const displayCase = activeCase || {
    id: "CSE-8992",
    severity: "CRITICAL",
    location: "Koramangala 4th Block, Junction",
    complaint: "Cardiac arrest reported by caller. Requires ALS unit immediately.",
  };

  const flash = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;

  // EXACT OLD ANIMATION SYSTEM + Repeating Audio/Haptics
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const playNotification = () => {
      Vibration.vibrate([0, 350, 160, 350]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    };

    // Play immediately
    playNotification();

    // Repeat the notification haptic/sound every 2.5 seconds until accepted
    if (!accepting) {
      interval = setInterval(playNotification, 2500);
    }

    Animated.parallel([
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 120, useNativeDriver: false }),
        Animated.timing(flash, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]),
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cardScale, flash, accepting]);

  const handleAccept = async () => {
    if (!driver) return;
    setAccepting(true);
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      await fetch(`${BACKEND_URL}/api/driver/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: driver.id,
          vehicle_id: driver.vehicle,
          timestamp: new Date().toISOString(),
        }),
      });
      router.replace("/active-case");
    } catch (e) {
      console.log("Failed to accept:", e);
      setAccepting(false);
    }
  };

  if (!driver) {
    return null;
  }

  // EXACT OLD COLOR INTERPOLATION
  const backgroundColor = flash.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.bg, "rgba(255,59,59,0.18)"],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.backdropCircle} />
        
        {/* EXACT OLD CARD */}
        <Animated.View style={[styles.card, styles.shadowsRedGlow, { transform: [{ scale: cardScale }] }]}>
          <View style={styles.topBand} />

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>DISPATCH ALERT</Text>
              <Text style={styles.title}>Driver response required</Text>
            </View>
            <View style={styles.severityBadge}>
              <Text style={styles.severityBadgeText}>{displayCase.severity}</Text>
            </View>
          </View>

          <View style={styles.primaryBlock}>
            <Text style={styles.locationLabel}>LOCATION</Text>
            <Text style={styles.locationValue}>{displayCase.location}</Text>
            <Text style={styles.complaintText}>{displayCase.complaint}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>CASE</Text>
              <Text style={styles.infoValue}>#{displayCase.id}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>UNIT</Text>
              <Text style={styles.infoValue}>{driver.vehicle}</Text>
            </View>
          </View>

          <Text style={styles.helperText}>
            This dispatch was generated from the classified emergency call flow. Accept to open the live route,
            corridor state, transcript, and patient brief.
          </Text>

          <Pressable
            disabled={accepting}
            onPress={handleAccept}
            style={({ pressed }) => [styles.acceptButton, pressed && !accepting && styles.acceptButtonPressed]}
          >
            <Text style={styles.acceptText}>{accepting ? "SYNCING..." : "ACCEPT AND OPEN LIVE CASE"}</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

// EXACT OLD STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  backdropCircle: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,59,59,0.08)",
    top: 120,
    right: -40,
  },
  card: {
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  shadowsRedGlow: {
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  topBand: {
    height: 6,
    backgroundColor: colors.red,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  eyebrow: {
    color: colors.red,
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 8,
    color: colors.textPrimary,
    ...typography.displayM,
    fontSize: 28,
    lineHeight: 32,
    maxWidth: 210,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,59,59,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,59,59,0.26)",
  },
  severityBadgeText: {
    color: colors.red,
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  primaryBlock: {
    margin: 22,
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  locationLabel: {
    color: colors.textMuted,
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  locationValue: {
    marginTop: 8,
    color: colors.textPrimary,
    ...typography.displayM,
    fontSize: 24,
    lineHeight: 30,
  },
  complaintText: {
    marginTop: 12,
    color: colors.textDim,
    ...typography.mono,
    fontSize: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 22,
  },
  infoCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  infoLabel: {
    color: colors.textMuted,
    ...typography.mono,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  infoValue: {
    marginTop: 8,
    color: colors.textPrimary,
    ...typography.displayM,
    fontSize: 16,
  },
  helperText: {
    paddingHorizontal: 22,
    paddingTop: 16,
    color: colors.textDim,
    ...typography.mono,
    fontSize: 11,
    lineHeight: 18,
  },
  acceptButton: {
    minHeight: 58,
    margin: 22,
    marginTop: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green,
  },
  acceptButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  acceptText: {
    color: colors.bg,
    ...typography.headingM,
    fontSize: 15,
    letterSpacing: 1,
  },
});
