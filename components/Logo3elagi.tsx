import React from "react";
import { View, type ViewStyle } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";

interface Props {
  height?: number;
  dark?: boolean;
  /** Icon mark only (no "3elagi" wordmark). */
  markOnly?: boolean;
  /** When true, wraps SVG in a full-width centered container (fixes visual offset). */
  centered?: boolean;
  style?: ViewStyle;
}

export function Logo3elagi({
  height = 44,
  dark = false,
  markOnly = false,
  centered = false,
  style,
}: Props) {
  const stroke = dark ? "#ffffff" : "#3057F2";
  const fill = dark ? "rgba(255,255,255,0.12)" : "rgba(48,87,242,0.08)";
  const ratio = markOnly ? 1 : 360 / 90;
  const width = height * ratio;
  const viewBox = markOnly ? "0 0 90 90" : "0 0 360 90";

  const svg = (
    <Svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      accessibilityLabel="3elagi"
    >
      <Circle cx={45} cy={45} r={42} fill={fill} stroke={stroke} strokeWidth={3} />
      <Path
        d="M 28,38 C 20,38 17,30 22,24 C 26,19 34,20 34,27"
        stroke={stroke}
        strokeWidth={5.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M 62,38 C 70,38 73,30 68,24 C 64,19 56,20 56,27"
        stroke={stroke}
        strokeWidth={5.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M 28,38 C 28,48 45,50 45,58"
        stroke={stroke}
        strokeWidth={5.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M 62,38 C 62,48 45,50 45,58"
        stroke={stroke}
        strokeWidth={5.5}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={45} cy={65} r={7} stroke={stroke} strokeWidth={4} fill="none" />
      <Circle cx={45} cy={65} r={2.5} fill={stroke} />
      {!markOnly ? (
        <SvgText
          x={98}
          y={62}
          fontFamily="System"
          fontWeight="800"
          fontSize={58}
          fill={stroke}
        >
          3elagi
        </SvgText>
      ) : null}
    </Svg>
  );

  if (!centered) return svg;

  // Mark + wordmark sit left of the viewBox center; nudge right for optical centering.
  const opticalOffsetX = markOnly ? 0 : width / 6;

  return (
    <View style={[{ width: "100%", alignItems: "center", justifyContent: "center" }, style]}>
      <View style={{ transform: [{ translateX: opticalOffsetX }] }}>{svg}</View>
    </View>
  );
}
