import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from "react-native-svg";
import type { Locale } from "@/domains/i18n/store";
import { useColors } from "@/hooks/useColors";

export const FLAG_RATIO = 3 / 2;

export const LANGUAGE_OPTIONS: {
  locale: Locale;
  label: string;
  sublabel: string;
}[] = [
  { locale: "ar", label: "العربية", sublabel: "Arabic" },
  { locale: "en", label: "English", sublabel: "English" },
];

export function FlagFrame({
  children,
  w,
  h,
  selected,
  colors,
}: {
  children: React.ReactNode;
  w: number;
  h: number;
  selected?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.flagFrame,
        {
          width: w + 4,
          height: h + 4,
          borderColor: selected ? colors.primary : "rgba(0,0,0,0.08)",
          backgroundColor: "#fff",
        },
      ]}
    >
      <View style={[styles.flagInner, { width: w, height: h, borderRadius: h * 0.18 }]}>
        {children}
      </View>
    </View>
  );
}

function EgyptFlag({ w, h, clipId }: { w: number; h: number; clipId: string }) {
  const stripe = 20;
  const rx = 3.6;
  return (
    <Svg width={w} height={h} viewBox="0 0 90 60">
      <Defs>
        <ClipPath id={clipId}>
          <Rect width="90" height="60" rx={rx} ry={rx} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Rect y="0" width="90" height={stripe} fill="#CE1126" />
        <Rect y={stripe} width="90" height={stripe} fill="#FFFFFF" />
        <Rect y={stripe * 2} width="90" height={stripe} fill="#000000" />
        <G transform="translate(45, 30)">
          <Circle r="9.5" fill="#C8A028" opacity={0.18} />
          <Path
            d="M0,-7 C4,-7 7,-4 7,0 C7,4 4,7 0,7 C-4,7 -7,4 -7,0 C-7,-4 -4,-7 0,-7 Z"
            fill="#C8A028"
          />
          <Path
            d="M-5,1 C-2,4 2,4 5,1 L3,5 C1,6 -1,6 -3,5 Z"
            fill="#8B6914"
          />
          <Ellipse cx="0" cy="-1" rx="3.2" ry="2.4" fill="#E8C547" />
        </G>
      </G>
    </Svg>
  );
}

function UKFlag({ w, h, clipId }: { w: number; h: number; clipId: string }) {
  const rx = 3.6;
  return (
    <Svg width={w} height={h} viewBox="0 0 90 60">
      <Defs>
        <ClipPath id={clipId}>
          <Rect width="90" height="60" rx={rx} ry={rx} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Rect width="90" height="60" fill="#012169" />
        <Path d="M0,0 L90,60 M90,0 L0,60" stroke="#FFFFFF" strokeWidth="12" />
        <Path d="M0,0 L90,60 M90,0 L0,60" stroke="#C8102E" strokeWidth="4.5" />
        <Rect x="36" y="0" width="18" height="60" fill="#FFFFFF" />
        <Rect x="0" y="21" width="90" height="18" fill="#FFFFFF" />
        <Rect x="39" y="0" width="12" height="60" fill="#C8102E" />
        <Rect x="0" y="24" width="90" height="12" fill="#C8102E" />
      </G>
    </Svg>
  );
}

export function Flag({
  locale,
  w,
  h,
  clipSuffix,
}: {
  locale: Locale;
  w: number;
  h: number;
  clipSuffix: string;
}) {
  const clipId = `flag-${locale}-${clipSuffix}`;
  return locale === "ar" ? (
    <EgyptFlag w={w} h={h} clipId={clipId} />
  ) : (
    <UKFlag w={w} h={h} clipId={clipId} />
  );
}

const styles = StyleSheet.create({
  flagFrame: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  flagInner: {
    overflow: "hidden",
  },
});
