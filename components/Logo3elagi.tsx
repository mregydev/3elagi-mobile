import React from "react";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";

interface Props {
  height?: number;
  dark?: boolean;
}

export function Logo3elagi({ height = 44, dark = false }: Props) {
  const stroke = dark ? "#ffffff" : "#3057F2";
  const fill = dark ? "rgba(255,255,255,0.12)" : "rgba(48,87,242,0.08)";
  const ratio = 360 / 90;
  const width = height * ratio;
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 360 90"
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
    </Svg>
  );
}
