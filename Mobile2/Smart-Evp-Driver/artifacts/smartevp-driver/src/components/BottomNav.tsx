import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { usePathname, useRouter, type Href } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, typography } from "@/src/theme";

type NavKey = "history" | "active" | "profile";

type NavItem = {
  key: NavKey;
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  route: Href;
};

const ITEMS: NavItem[] = [
  { key: "history", label: "History", icon: "clock", route: "/trip-history" },
  {
    key: "active",
    label: "Active",
    icon: "navigation",
    route: "/active-case",
  },
  { key: "profile", label: "Profile", icon: "user", route: "/profile" },
];

const ROUTE_TO_KEY: Record<string, NavKey> = {
  "/trip-history": "history",
  "/active-case": "active",
  "/profile": "profile",
};

const BASE_SIZE = 44;
const ACTIVE_SIZE = 56;

const SPRING = { mass: 0.4, stiffness: 180, damping: 14 } as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeKey = ROUTE_TO_KEY[pathname] ?? null;

  const handlePress = (item: NavItem) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => undefined);
    }
    if (activeKey === item.key) return;
    router.push(item.route);
  };

  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View
      style={[styles.wrapper, { paddingBottom: bottomPad }]}
      pointerEvents="box-none"
    >
      <BlurView intensity={50} tint="dark" style={styles.dock}>
        {ITEMS.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <DockItem
              key={item.key}
              item={item}
              isActive={isActive}
              onPress={() => handlePress(item)}
            />
          );
        })}
      </BlurView>
    </View>
  );
}

type DockItemProps = {
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
};

function DockItem({ item, isActive, onPress }: DockItemProps) {
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(1 - pressed.value * 0.08, SPRING),
      },
      {
        translateY: withSpring(isActive ? -6 : 0, SPRING),
      },
    ],
  }));

  const size = isActive ? ACTIVE_SIZE : BASE_SIZE;
  const iconColor = isActive ? colors.cyan : colors.textMuted;
  const bg = isActive ? colors.cyanSoft : "rgba(255,255,255,0.04)";
  const borderColor = isActive
    ? "rgba(34,211,238,0.55)"
    : colors.glassBorder;

  return (
    <View style={styles.itemWrap}>
      {isActive ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={styles.tooltip}
          pointerEvents="none"
        >
          <Text style={styles.tooltipText}>{item.label}</Text>
        </Animated.View>
      ) : null}

      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressed.value = 1;
        }}
        onPressOut={() => {
          pressed.value = 0;
        }}
        hitSlop={4}
      >
        <Animated.View
          style={[
            styles.iconCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bg,
              borderColor,
              shadowColor: isActive ? colors.cyan : "#000",
              shadowOpacity: isActive ? 0.5 : 0.25,
              shadowRadius: isActive ? 12 : 6,
              shadowOffset: { width: 0, height: isActive ? 0 : 3 },
            },
            animStyle,
          ]}
        >
          <Feather
            name={item.icon}
            size={isActive ? 22 : 18}
            color={iconColor}
          />
        </Animated.View>
      </Pressable>

      {isActive ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={[styles.activeDot, { backgroundColor: colors.cyan }]}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  dock: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    paddingHorizontal: 14,
    paddingBottom: 8,
    paddingTop: 22,
    borderRadius: 36,
    overflow: "hidden",
    backgroundColor: "rgba(15,20,34,0.7)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  itemWrap: {
    alignItems: "center",
    justifyContent: "flex-end",
    width: ACTIVE_SIZE,
    height: ACTIVE_SIZE + 4,
    position: "relative",
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    elevation: 4,
  },
  tooltip: {
    position: "absolute",
    top: -28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(10,14,26,0.95)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    zIndex: 10,
  },
  tooltipText: {
    ...typography.labelM,
    fontSize: 10,
    color: colors.textPrimary,
  },
  activeDot: {
    position: "absolute",
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default BottomNav;
