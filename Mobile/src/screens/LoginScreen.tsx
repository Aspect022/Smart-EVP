import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RootScreenProps } from "../../App";
import { DRIVERS } from "../config/drivers";
import { useDriver } from "../context/DriverContext";
import { colors, fonts } from "../theme";

export function LoginScreen({ navigation }: RootScreenProps<"Login">) {
  const { setDriver } = useDriver();
  const driver = DRIVERS[0];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>DRIVER TERMINAL</Text>
          <Text style={styles.title}>Assigned Vehicle{"\n"}Ready to Link</Text>
          <Text style={styles.subtitle}>
            This phone is reserved for the primary ambulance. As soon as a call is classified and dispatched, the
            driver alert appears here.
          </Text>
        </View>

        <View style={styles.assignmentCard}>
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>AMBULANCE 01</Text>
            <Text style={styles.badgeMuted}>LIVE DEMO UNIT</Text>
          </View>

          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{driver.name[0]}</Text>
            </View>
            <View style={styles.identityBody}>
              <Text style={styles.name}>{driver.name}</Text>
              <Text style={styles.meta}>{driver.vehicle}</Text>
              <Text style={styles.meta}>{driver.license}</Text>
            </View>
          </View>

          <View style={styles.detailStrip}>
            <View style={styles.detailPill}>
              <Text style={styles.detailLabel}>ROLE</Text>
              <Text style={styles.detailValue}>Primary Driver</Text>
            </View>
            <View style={styles.detailPill}>
              <Text style={styles.detailLabel}>MODE</Text>
              <Text style={styles.detailValue}>Expo Go</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => {
            setDriver(driver);
            navigation.replace("Home");
          }}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>ENTER DRIVER APP</Text>
        </Pressable>
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
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  hero: {
    paddingTop: 8,
  },
  eyebrow: {
    color: colors.cyan,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3,
  },
  title: {
    marginTop: 12,
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 12,
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 20,
    maxWidth: 320,
  },
  assignmentCard: {
    marginTop: 26,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: colors.border,
    borderTopColor: colors.cyan,
    backgroundColor: colors.card,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  badge: {
    color: colors.cyan,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
  },
  badgeMuted: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  identityRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.14)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
  },
  avatarText: {
    color: colors.cyan,
    fontFamily: fonts.displayBold,
    fontSize: 26,
  },
  identityBody: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  meta: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  detailStrip: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  detailPill: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  detailValue: {
    marginTop: 6,
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 14,
  },
  button: {
    minHeight: 58,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: colors.bg,
    fontFamily: fonts.displayBold,
    fontSize: 16,
    letterSpacing: 1.5,
  },
});
