import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { BodyPart } from "@/domains/medical/bodyParts";
import type { MedicalRecord } from "@/domains/medical/types";
import { WEB_BREAKPOINTS } from "@/constants/webLayout";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { chatFlexRow } from "@/utils/rtl";

interface Props {
  selectedPart: BodyPart | null;
  records: MedicalRecord[];
  canAdd?: boolean;
  onSelectPart: (part: BodyPart | null) => void;
  onAddForPart?: (part: BodyPart) => void;
}

/** Smooth full-body silhouette — transparent PNG. */
const BODY_SRC = require("@/assets/images/body-figure.png");

const HAS_TINT = "rgba(224, 122, 47, 0.4)";
const SELECT_TINT = "rgba(13, 148, 136, 0.48)";

const ASSET_W = 619;
const ASSET_H = 1472;

type HitRegion = {
  part: Exclude<BodyPart, "general" | "back">;
  x: number;
  y: number;
  w: number;
  h: number;
};

const BODY_HITS: HitRegion[] = [
  { part: "head", x: 0.34, y: 0.01, w: 0.32, h: 0.12 },
  { part: "neck", x: 0.42, y: 0.12, w: 0.16, h: 0.04 },
  { part: "chest", x: 0.3, y: 0.15, w: 0.4, h: 0.13 },
  { part: "abdomen", x: 0.34, y: 0.27, w: 0.32, h: 0.1 },
  { part: "pelvis", x: 0.32, y: 0.36, w: 0.36, h: 0.09 },
  { part: "left_arm", x: 0.04, y: 0.17, w: 0.26, h: 0.28 },
  { part: "right_arm", x: 0.7, y: 0.17, w: 0.26, h: 0.28 },
  { part: "left_hand", x: 0.0, y: 0.43, w: 0.16, h: 0.08 },
  { part: "right_hand", x: 0.84, y: 0.43, w: 0.16, h: 0.08 },
  { part: "left_leg", x: 0.3, y: 0.45, w: 0.18, h: 0.38 },
  { part: "right_leg", x: 0.52, y: 0.45, w: 0.18, h: 0.38 },
  { part: "left_foot", x: 0.26, y: 0.83, w: 0.22, h: 0.12 },
  { part: "right_foot", x: 0.52, y: 0.83, w: 0.22, h: 0.12 },
];

/** Prefer filling the parent pane; fallback fraction of viewport. */
export function bodyFigureViewportHeight(
  screenHeight: number,
  screenWidth: number,
): number {
  const isDesktop = screenWidth >= WEB_BREAKPOINTS.desktop;
  return Math.round(screenHeight * (isDesktop ? 0.7 : 0.85));
}

export function BodySkeletonView({
  selectedPart,
  records,
  canAdd = false,
  onSelectPart,
  onAddForPart,
}: Props) {
  const colors = useColors();
  const { t } = useI18n();
  const dir = chatFlexRow();
  const { width, height: screenHeight } = useWindowDimensions();
  const [paneHeight, setPaneHeight] = useState(0);

  const partsWithRecords = useMemo(() => {
    const set = new Set<BodyPart>();
    for (const r of records) {
      if (r.bodyPart) set.add(r.bodyPart);
    }
    return set;
  }, [records]);

  const toggle = (part: BodyPart) => {
    onSelectPart(selectedPart === part ? null : part);
  };

  const onPaneLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.height);
    if (next > 0 && next !== paneHeight) setPaneHeight(next);
  };

  // Chips ~40 + gaps; selection bar ~52 when visible.
  const chrome = 48 + (selectedPart ? 56 : 0);
  const fallback = bodyFigureViewportHeight(screenHeight, width);
  const figureHeight = Math.max(
    120,
    (paneHeight > chrome ? paneHeight - chrome : fallback) - 4,
  );
  const figureWidth = Math.round(figureHeight * (ASSET_W / ASSET_H));

  const tintFor = (part: BodyPart) => {
    if (selectedPart === part) return SELECT_TINT;
    if (partsWithRecords.has(part)) return HAS_TINT;
    return "transparent";
  };

  const chip = (
    part: BodyPart | null,
    label: string,
    active: boolean,
    hasDot?: boolean,
  ) => (
    <Pressable
      onPress={() => {
        if (part === null) {
          onSelectPart(null);
          return;
        }
        onSelectPart(active ? null : part);
      }}
      style={[
        styles.chip,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? `${colors.primary}18` : colors.muted,
        },
      ]}
    >
      <Text
        style={{
          color: active ? colors.primary : colors.foreground,
          fontWeight: "700",
          fontSize: 12,
        }}
      >
        {label}
        {hasDot ? " •" : ""}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.wrap} onLayout={onPaneLayout}>
      <View style={[styles.chipRow, { flexDirection: dir }]}>
        {chip(null, t.records.bodyPartAll, !selectedPart)}
        {chip(
          "general",
          t.records.bodyParts.general,
          selectedPart === "general",
          partsWithRecords.has("general"),
        )}
        {chip(
          "back",
          t.records.bodyParts.back,
          selectedPart === "back",
          partsWithRecords.has("back"),
        )}
      </View>

      <View style={styles.diagramCard}>
        <View style={{ width: figureWidth, height: figureHeight }}>
          <Image
            source={BODY_SRC}
            style={{
              width: figureWidth,
              height: figureHeight,
              backgroundColor: "transparent",
            }}
            contentFit="contain"
            accessibilityLabel={t.records.skeletonView}
          />
          {BODY_HITS.map((region) => (
            <Pressable
              key={region.part}
              onPress={() => toggle(region.part)}
              accessibilityRole="button"
              accessibilityLabel={t.records.bodyParts[region.part]}
              style={{
                position: "absolute",
                left: Math.round(region.x * figureWidth),
                top: Math.round(region.y * figureHeight),
                width: Math.round(region.w * figureWidth),
                height: Math.round(region.h * figureHeight),
                backgroundColor: tintFor(region.part),
                borderRadius: 8,
              }}
            />
          ))}
        </View>
      </View>

      {selectedPart ? (
        <View style={[styles.selectionBar, { flexDirection: dir, borderColor: colors.border }]}>
          <Text style={{ color: colors.foreground, fontWeight: "700", flex: 1, fontSize: 13 }}>
            {t.records.selectedPart}: {t.records.bodyParts[selectedPart]}
          </Text>
          {canAdd && onAddForPart ? (
            <Pressable
              onPress={() => onAddForPart(selectedPart)}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.addBtnText}>{t.records.addForPart}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    gap: 8,
  },
  chipRow: { gap: 6, flexWrap: "wrap", flexShrink: 0 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  diagramCard: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  selectionBar: {
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexShrink: 0,
  },
  addBtn: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
