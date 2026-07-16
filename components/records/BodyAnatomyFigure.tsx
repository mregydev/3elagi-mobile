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
 * Top → head through full neck (divider at base of neck / above clavicles);
 * medium → shoulders, arms + torso to iliac crest;
 * bottom starts at pelvis through legs/feet.
 */
export const ZONE_BANDS: Record<
  BodyZone,
  { y: number; h: number; color: string; accent: string }
> = {
  top: { y: 0.0, h: 0.24, color: "rgba(99, 102, 241, 0.08)", accent: "#6366F1" },
  medium: { y: 0.24, h: 0.28, color: "rgba(13, 148, 136, 0.08)", accent: "#0D9488" },
  bottom: { y: 0.52, h: 0.48, color: "rgba(234, 88, 12, 0.08)", accent: "#EA580C" },
};

export const ZONE_DIVIDERS = [0.24, 0.52] as const;

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
  /** Mobile / mobile-web: fill the slot height; wider zone labels. */
  compact?: boolean;
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
  compact = false,
}: Props) {
  const slotW = Math.max(1, Math.round(width));
  const slotH = Math.max(1, Math.round(height));

  // Mobile rail wide enough for full labels (e.g. "Medium").
  const railW = compact
    ? Math.round(Math.min(Math.max(slotW * 0.26, 84), 108))
    : Math.round(Math.min(Math.max(slotW * 0.22, 80), 108));

  let drawW: number;
  let drawH: number;
  if (compact) {
    // Fill the 90% screen slot so the skeleton is actually tall.
    drawW = Math.max(80, slotW - railW);
    drawH = slotH;
  } else {
    const bodyBudgetW = Math.max(80, slotW - railW);
    const scale = Math.min(slotH / ANATOMY_ASSET_H, bodyBudgetW / ANATOMY_ASSET_W);
    drawW = Math.max(1, Math.round(ANATOMY_ASSET_W * scale));
    drawH = Math.max(1, Math.round(ANATOMY_ASSET_H * scale));
  }
  const totalW = drawW + railW;

  const labelScale = compact
    ? Math.min(Math.max(drawH / 480, 0.9), 1.2)
    : Math.min(Math.max(drawH / 420, 0.9), 1.25);
  const iconSize = Math.round((compact ? 16 : 18) * labelScale);
  const labelFontSize = Math.round((compact ? 12 : 11) * labelScale);
  const accentBarW = Math.max(3, Math.round((compact ? 4 : 5) * labelScale));
  const recordDotSize = Math.max(5, Math.round(6 * labelScale));

  return (
    <View style={[styles.figureWrap, { width: totalW, height: drawH }]}>
      <View
        style={[
          styles.zoneRail,
          isRTL ? { right: 0 } : { left: 0 },
          { height: drawH, width: railW },
        ]}
        pointerEvents="box-none"
      >
        {(["top", "medium", "bottom"] as BodyZone[]).map((zone) => {
          const band = ZONE_BANDS[zone];
          const top = Math.round(band.y * drawH);
          // Keep a little air under the bottom zone card so it doesn't sit on the pane edge.
          const h = Math.max(
            22,
            Math.round(band.h * drawH) - (zone === "bottom" ? 12 : 4),
          );
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
                compact && styles.zoneIndicatorCompact,
                {
                  top,
                  height: h,
                  borderColor: active ? band.accent : has ? `${band.accent}99` : border,
                  backgroundColor: active ? `${band.accent}22` : cardBg,
                },
              ]}
            >
              <View
                style={[
                  styles.zoneAccentBar,
                  { backgroundColor: band.accent, width: accentBarW },
                ]}
              />
              <ZoneIcon
                width={iconSize}
                height={iconSize}
                color={active ? band.accent : mutedForeground}
              />
              <Text
                style={{
                  color: active ? band.accent : foreground,
                  fontWeight: "800",
                  fontSize: labelFontSize,
                  textAlign: "center",
                  lineHeight: labelFontSize + 2,
                  paddingHorizontal: 2,
                }}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {zoneLabels[zone]}
              </Text>
              {has ? (
                <View
                  style={{
                    backgroundColor: band.accent,
                    width: recordDotSize,
                    height: recordDotSize,
                    borderRadius: recordDotSize / 2,
                  }}
                />
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
          style={{ width: drawW, height: drawH }}
          // Mobile fills the tall slot; desktop keeps natural aspect.
          contentFit={compact ? "fill" : "contain"}
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
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    overflow: "hidden",
  },
  zoneIndicatorCompact: {
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 4,
  },
  zoneAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
});
