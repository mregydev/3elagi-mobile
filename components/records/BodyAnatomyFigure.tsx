import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BODY_ZONE_ICONS } from "@/components/records/bodyPartIcons";
import type { BodyZone } from "@/domains/medical/bodyParts";

/** Transparent anatomy PNG — skeleton + organs. */
const BODY_SRC = require("@/assets/images/body-anatomy.png");

export const ANATOMY_ASSET_W = 631;
export const ANATOMY_ASSET_H = 790;

/**
 * Zone bands as fractions of the drawn figure height.
 * Top → neck/clavicles; medium → torso ending at iliac crest;
 * bottom starts at pelvis through legs/feet.
 */
export const ZONE_BANDS: Record<
  BodyZone,
  { y: number; h: number; color: string; accent: string }
> = {
  top: { y: 0.0, h: 0.22, color: "rgba(99, 102, 241, 0.08)", accent: "#6366F1" },
  medium: { y: 0.22, h: 0.30, color: "rgba(13, 148, 136, 0.08)", accent: "#0D9488" },
  bottom: { y: 0.52, h: 0.48, color: "rgba(234, 88, 12, 0.08)", accent: "#EA580C" },
};

export const ZONE_DIVIDERS = [0.22, 0.52] as const;

type Props = {
  width: number;
  height: number;
  openZone: BodyZone | null;
  zonesWithRecords: Set<BodyZone>;
  zoneLabels: Record<BodyZone, string>;
  onSelectZone: (zone: BodyZone) => void;
  foreground: string;
  mutedForeground: string;
  cardBg: string;
  border: string;
  isRTL: boolean;
};

export function BodyAnatomyFigure({
  width,
  height,
  openZone,
  zonesWithRecords,
  zoneLabels,
  onSelectZone,
  foreground,
  mutedForeground,
  cardBg,
  border,
  isRTL,
}: Props) {
  const railW = 92;
  // Fit inside the available diagram slot (height + width).
  const scaleByH = height / ANATOMY_ASSET_H;
  const scaleByW = Math.max(120, width - railW) / ANATOMY_ASSET_W;
  const scale = Math.min(scaleByH, scaleByW);
  const drawW = Math.round(ANATOMY_ASSET_W * scale);
  const drawH = Math.round(ANATOMY_ASSET_H * scale);

  return (
    <View style={[styles.figureWrap, { width: drawW + railW, height: drawH }]}>
      <View
        style={[
          styles.zoneRail,
          isRTL ? { right: 0 } : { left: 0 },
          { height: drawH, width: railW - 4 },
        ]}
        pointerEvents="box-none"
      >
        {(["top", "medium", "bottom"] as BodyZone[]).map((zone) => {
          const band = ZONE_BANDS[zone];
          const top = Math.round(band.y * drawH);
          const h = Math.max(Math.round(band.h * drawH) - 8, 48);
          const active = openZone === zone;
          const has = zonesWithRecords.has(zone);
          const ZoneIcon = BODY_ZONE_ICONS[zone];
          return (
            <Pressable
              key={zone}
              onPress={() => onSelectZone(zone)}
              accessibilityRole="button"
              accessibilityLabel={zoneLabels[zone]}
              style={[
                styles.zoneIndicator,
                {
                  top,
                  height: h,
                  borderColor: active ? band.accent : has ? `${band.accent}99` : border,
                  backgroundColor: active ? `${band.accent}18` : cardBg,
                },
              ]}
            >
              <View style={[styles.zoneAccentBar, { backgroundColor: band.accent }]} />
              <ZoneIcon width={20} height={20} color={active ? band.accent : mutedForeground} />
              <Text
                style={{
                  color: active ? band.accent : foreground,
                  fontWeight: "800",
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                {zoneLabels[zone]}
              </Text>
              {has ? (
                <View style={[styles.recordDot, { backgroundColor: band.accent }]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          width: drawW,
          height: drawH,
          marginLeft: isRTL ? 0 : railW,
          marginRight: isRTL ? railW : 0,
          backgroundColor: "transparent",
          overflow: "hidden",
        }}
      >
        <Image
          source={BODY_SRC}
          style={{
            width: drawW,
            height: drawH,
            backgroundColor: "transparent",
          }}
          contentFit="contain"
          accessibilityLabel={zoneLabels.medium}
        />

        {(["top", "medium", "bottom"] as BodyZone[]).map((zone) => {
          const band = ZONE_BANDS[zone];
          const active = openZone === zone;
          return (
            <Pressable
              key={`band-${zone}`}
              onPress={() => onSelectZone(zone)}
              style={{
                position: "absolute",
                left: Math.round(drawW * 0.05),
                width: Math.round(drawW * 0.9),
                top: Math.round(band.y * drawH),
                height: Math.round(band.h * drawH),
                backgroundColor: active ? `${band.accent}24` : band.color,
                borderRadius: 12,
                borderWidth: active ? 2 : 0,
                borderColor: band.accent,
              }}
            />
          );
        })}

        {ZONE_DIVIDERS.map((y, i) => (
          <View
            key={`div-${i}`}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: Math.round(drawW * 0.08),
              right: Math.round(drawW * 0.08),
              top: Math.round(y * drawH),
              height: 1,
              borderStyle: "dashed",
              borderWidth: 1,
              borderColor: i === 0 ? "rgba(99,102,241,0.55)" : "rgba(13,148,136,0.55)",
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  figureWrap: {
    position: "relative",
    alignSelf: "center",
    backgroundColor: "transparent",
  },
  zoneRail: {
    position: "absolute",
    zIndex: 2,
  },
  zoneIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
  },
  zoneAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  recordDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
