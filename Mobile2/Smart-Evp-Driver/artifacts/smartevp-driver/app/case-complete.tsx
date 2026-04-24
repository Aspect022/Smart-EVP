import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassCard } from "@/src/components/GlassCard";
import { colors, typography } from "@/src/theme";

export default function CaseCompleteScreen() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => {
      router.replace("/home");
    }, 3200);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.checkWrap}>
          <Feather name="check-circle" size={56} color={colors.green} />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(120).duration(380)}
          style={styles.title}
        >
          Case Complete
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(220).duration(380)}
          style={styles.subtitle}
        >
          Patient handed over · Returning to standby
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(320).duration(380)}>
          <GlassCard topBorderColor={colors.green} style={styles.card}>
            <Text style={styles.cardLabel}>NEXT STEPS</Text>
            <Text style={styles.cardBody}>
              You will be returned to the home console in a moment. The
              dispatch log has been saved to your trip history.
            </Text>
          </GlassCard>
        </Animated.View>

        <Pressable
          onPress={() => router.replace("/home")}
          style={styles.linkWrap}
        >
          <Text style={styles.link}>Return now →</Text>
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
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  checkWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    ...typography.displayL,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodyM,
    color: colors.textDim,
    textAlign: "center",
  },
  card: {
    marginTop: 18,
    width: "100%",
  },
  cardLabel: {
    ...typography.labelM,
    color: colors.green,
    marginBottom: 6,
  },
  cardBody: {
    ...typography.bodyM,
    color: colors.textDim,
  },
  linkWrap: {
    marginTop: 18,
  },
  link: {
    ...typography.bodyM,
    color: colors.cyan,
  },
});
