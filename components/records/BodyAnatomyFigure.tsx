import { Image } from "expo-image";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  HIT_ORDER,
  ZONE_BBOXES,
  zoneAtViewPoint,
} from "@/components/records/bodyPartHitTest";
import { ANATOMY_VIEWBOX } from "@/components/records/bodyPartShapes";
import { RecordPulseDot } from "@/components/records/RecordPulseDot";
import type { BodyZone } from "@/domains/medical/bodyParts";

/** Transparent anatomy PNG — skeleton + organs. */
const BODY_SRC = require("@/assets/images/body-anatomy.png");

export const ANATOMY_ASSET_W = ANATOMY_VIEWBOX.w;
export const ANATOMY_ASSET_H = ANATOMY_VIEWBOX.h;

export type ZoneTapAnchor = { x: number; y: number };

type Props = {
  width: number;
  height: number;
  zoneLabels: Record<BodyZone, string>;
  onSelectZone: (zone: BodyZone, anchor: ZoneTapAnchor) => void;
  /** Mobile / mobile-web: fill the slot; still keeps anatomy aspect (letterbox). */
  compact?: boolean;
  /** Zones that already have medical records — show indicator dots. */
  zonesWithRecords?: ReadonlySet<BodyZone>;
  /** Currently highlighted body area (legend sync). */
  highlightedZone?: BodyZone | null;
};

export function BodyAnatomyFigure({
  width,
  height,
  zoneLabels,
  onSelectZone,
  compact = false,
  zonesWithRecords,
  highlightedZone = null,
}: Props) {
  const slotW = Math.max(1, Math.round(width));
  const slotH = Math.max(1, Math.round(height));

  // Uniform scale so hit overlays stay locked to the PNG pixels.
  const scale = Math.min(slotH / ANATOMY_ASSET_H, slotW / ANATOMY_ASSET_W);
  const drawW = Math.max(1, Math.round(ANATOMY_ASSET_W * scale));
  const drawH = Math.max(1, Math.round(ANATOMY_ASSET_H * scale));
  const sx = drawW / ANATOMY_VIEWBOX.w;
  const sy = drawH / ANATOMY_VIEWBOX.h;

  const recordDots = useMemo(() => {
    if (!zonesWithRecords?.size) return [];
    return HIT_ORDER.filter((zone) => zonesWithRecords.has(zone)).map((zone) => {
      const box = ZONE_BBOXES[zone];
      const cx = (box.minX + box.maxX) / 2;
      const cy = (box.minY + box.maxY) / 2;
      return {
        zone,
        left: Math.round(cx * sx),
        top: Math.round(cy * sy),
      };
    });
  }, [zonesWithRecords, sx, sy]);

  return (
    <View
      style={[
        styles.figureWrap,
        compact && styles.figureWrapCompact,
        { width: compact ? slotW : drawW, height: compact ? slotH : drawH },
      ]}
    >
      <View style={{ width: drawW, height: drawH }}>
        <Image
          source={BODY_SRC}
          style={{ width: drawW, height: drawH }}
          contentFit="contain"
          pointerEvents="none"
        />

        {HIT_ORDER.map((zone, index) => {
          const box = ZONE_BBOXES[zone];
          const left = Math.round(box.minX * sx);
          const top = Math.round(box.minY * sy);
          const w = Math.max(16, Math.round((box.maxX - box.minX) * sx));
          const h = Math.max(16, Math.round((box.maxY - box.minY) * sy));
          const highlighted = highlightedZone === zone;
          return (
            <Pressable
              key={`hit-${zone}`}
              accessibilityRole="button"
              accessibilityLabel={zoneLabels[zone]}
              accessibilityState={{ selected: highlighted }}
              hitSlop={4}
              onPress={(e) => {
                const { pageX, pageY, locationX, locationY } = e.nativeEvent;
                let nextZone: BodyZone = zone;
                if (
                  typeof locationX === "number" &&
                  typeof locationY === "number" &&
                  Number.isFinite(locationX) &&
                  Number.isFinite(locationY)
                ) {
                  const viewX = box.minX + locationX / sx;
                  const viewY = box.minY + locationY / sy;
                  nextZone = zoneAtViewPoint(viewX, viewY) ?? zone;
                }
                onSelectZone(nextZone, {
                  x: typeof pageX === "number" ? pageX : left + w / 2,
                  y: typeof pageY === "number" ? pageY : top + h / 2,
                });
              }}
              style={{
                position: "absolute",
                left,
                top,
                width: w,
                height: h,
                zIndex: 10 + index,
                backgroundColor: highlighted
                  ? "rgba(239, 68, 68, 0.12)"
                  : "rgba(0,0,0,0.001)",
                borderWidth: highlighted ? 2 : 0,
                borderColor: highlighted ? "rgba(239, 68, 68, 0.55)" : "transparent",
                borderRadius: 8,
              }}
            />
          );
        })}

        {recordDots.map((dot) => (
          <RecordPulseDot
            key={`dot-${dot.zone}`}
            size="lg"
            left={dot.left}
            top={dot.top}
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
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  figureWrapCompact: {
    width: "100%",
  },
});
