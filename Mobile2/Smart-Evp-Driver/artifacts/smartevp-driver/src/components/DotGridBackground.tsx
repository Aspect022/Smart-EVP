import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";

import { colors } from "@/src/theme";

export type DotGridBackgroundProps = {
  spacing?: number;
  radius?: number;
  opacity?: number;
};

export function DotGridBackground({
  spacing = 22,
  radius = 1,
  opacity = 0.02,
}: DotGridBackgroundProps) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity }]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="smartevp-dots"
            patternUnits="userSpaceOnUse"
            width={spacing}
            height={spacing}
          >
            <Circle
              cx={radius}
              cy={radius}
              r={radius}
              fill={colors.textPrimary}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#smartevp-dots)" />
      </Svg>
    </View>
  );
}

export default DotGridBackground;
