import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { RootScreenProps } from "../../App";
import { DRIVERS } from "../config/drivers";
import { useDriver } from "../context/DriverContext";
import { colors, fonts } from "../theme";

export function LoginScreen({ navigation }: RootScreenProps<"Login">) {
  const { setDriver } = useDriver();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>01 — DRIVER PROFILE</Text>
        <Text style={styles.title}>Select Your{"\n"}Profile</Text>
        <Text style={styles.subtitle}>SmartEVP+ dispatch alerts will appear on this device.</Text>

        <View style={styles.list}>
          {DRIVERS.map((driver) => (
            <Pressable
              key={driver.id}
              onPress={() => {
                setDriver(driver);
                navigation.replace("Home");
              }}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{driver.name[0]}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.name}>{driver.name}</Text>
                <Text style={styles.meta}>
                  {driver.license} · {driver.vehicle}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 10,
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 36,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 10,
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 18,
  },
  list: {
    marginTop: 36,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 2,
    borderColor: colors.border,
    borderTopColor: colors.cyan,
    backgroundColor: colors.card,
  },
  cardPressed: {
    borderColor: colors.border2,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.16)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
  },
  avatarText: {
    color: colors.cyan,
    fontFamily: fonts.displayBold,
    fontSize: 20,
  },
  cardBody: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 16,
  },
  meta: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  chevron: {
    color: colors.textMuted,
    fontFamily: fonts.displayBold,
    fontSize: 24,
  },
});
