import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import { X } from "lucide-react-native";
import { BodyAnatomyFigure } from "@/components/records/BodyAnatomyFigure";
import { BODY_PART_ICONS, BODY_ZONE_ICONS, BodyPartIcon } from "@/components/records/bodyPartIcons";
import {
  BODY_PARTS_BY_ZONE,
  BODY_ZONES,
  type BodyPart,
  type BodyZone,
  zoneForBodyPart,
} from "@/domains/medical/bodyParts";
import type { MedicalRecord } from "@/domains/medical/types";
import { WEB_BREAKPOINTS } from "@/constants/webLayout";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { flexRow } from "@/utils/rtl";

interface Props {
  selectedPart: BodyPart | null;
  records: MedicalRecord[];
  onSelectPart: (part: BodyPart | null) => void;
  /**
   * Mobile flow: selecting a body part opens filtered records
   * instead of filtering in-place beside the skeleton.
   */
  onOpenPart?: (part: BodyPart) => void;
}

const ZONE_ACCENT: Record<BodyZone, string> = {
  top: "#6366F1",
  medium: "#0D9488",
  bottom: "#EA580C",
};

const MOBILE_FIGURE_HEIGHT_RATIO = 0.7;
const MOBILE_FIGURE_WIDTH_RATIO = 0.9;

/** Prefer filling the parent pane; fallback fraction of viewport. */
export function bodyFigureViewportHeight(
  screenHeight: number,
  screenWidth: number,
): number {
  const isDesktop = screenWidth >= WEB_BREAKPOINTS.desktop;
  return Math.round(screenHeight * (isDesktop ? 0.72 : MOBILE_FIGURE_HEIGHT_RATIO));
}

/** Mobile / mobile-web skeleton width target (viewport fraction). */
export function bodyFigureViewportWidth(screenWidth: number): number {
  return Math.round(screenWidth * MOBILE_FIGURE_WIDTH_RATIO);
}

export function BodySkeletonView({
  selectedPart,
  records,
  onSelectPart,
  onOpenPart,
}: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const { isDesktop } = useWebLayout();
  const usePopupPicker = !isDesktop;
  const { width, height: screenHeight } = useWindowDimensions();
  const [paneWidth, setPaneWidth] = useState(0);
  const [diagramH, setDiagramH] = useState(0);
  const [diagramW, setDiagramW] = useState(0);
  const [openZone, setOpenZone] = useState<BodyZone | null>(
    () => (selectedPart ? zoneForBodyPart(selectedPart) : null),
  );

  useEffect(() => {
    if (!selectedPart) return;
    const zone = zoneForBodyPart(selectedPart);
    if (zone) setOpenZone(zone);
  }, [selectedPart]);

  const partsWithRecords = useMemo(() => {
    const set = new Set<BodyPart>();
    for (const r of records) {
      if (r.bodyPart) set.add(r.bodyPart);
    }
    return set;
  }, [records]);

  const zonesWithRecords = useMemo(() => {
    const set = new Set<BodyZone>();
    for (const part of partsWithRecords) {
      const zone = zoneForBodyPart(part);
      if (zone) set.add(zone);
    }
    return set;
  }, [partsWithRecords]);

  const onPaneLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && w !== paneWidth) setPaneWidth(w);
  };

  const onDiagramLayout = (e: LayoutChangeEvent) => {
    const { height: nextH, width: nextW } = e.nativeEvent.layout;
    const h = Math.round(nextH);
    const w = Math.round(nextW);
    if (h > 0 && h !== diagramH) setDiagramH(h);
    if (w > 0 && w !== diagramW) setDiagramW(w);
  };

  // Mobile: fixed 90% of the screen (pixels). Do not use parent % / onLayout —
  // contain-fit inside a short parent is what made the skeleton look tiny.
  const mobileFigureH = Math.max(280, bodyFigureViewportHeight(screenHeight, width));
  const mobileFigureW = Math.max(180, bodyFigureViewportWidth(width));
  const parentW = paneWidth > 0 ? paneWidth : Math.round(width * 0.5);

  const figureHeight = isDesktop
    ? Math.max(180, diagramH > 0 ? diagramH : Math.round(screenHeight * 0.72))
    : mobileFigureH;
  const figureWidth = isDesktop
    ? Math.max(180, diagramW > 0 ? diagramW : Math.round(parentW * 0.98))
    : mobileFigureW;

  const mobileBoxStyle: ViewStyle = {
    width: mobileFigureW,
    height: mobileFigureH,
    alignSelf: "center",
  };

  const selectZone = (zone: BodyZone) => {
    setOpenZone((prev) => (prev === zone ? null : zone));
  };

  const selectPart = (part: BodyPart) => {
    if (onOpenPart) {
      onOpenPart(part);
      return;
    }
    const next = selectedPart === part ? null : part;
    onSelectPart(next);
    if (next) {
      const zone = zoneForBodyPart(next);
      if (zone) setOpenZone(zone);
    }
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
          setOpenZone(null);
          return;
        }
        onSelectPart(active ? null : part);
        if (!active) setOpenZone(null);
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

  const zoneParts = openZone ? BODY_PARTS_BY_ZONE[openZone] : [];
  const closePartPicker = () => setOpenZone(null);

  const partPickerContent =
    openZone != null ? (
      <>
        <View style={[styles.partListHeader, { flexDirection: dir }]}>
          <View
            style={[styles.partListAccent, { backgroundColor: ZONE_ACCENT[openZone] }]}
          />
          <View style={styles.partListHeaderText}>
            <Text
              style={[
                styles.partListEyebrow,
                { color: ZONE_ACCENT[openZone], textAlign: isRTL ? "right" : "left" },
              ]}
              numberOfLines={1}
            >
              {t.records.bodyZones[openZone]}
            </Text>
            <Text
              style={[
                styles.partListTitle,
                { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
              ]}
              numberOfLines={1}
            >
              {t.records.bodyZonePick}
            </Text>
          </View>
          <View
            style={[
              styles.partCountPill,
              { backgroundColor: `${ZONE_ACCENT[openZone]}14` },
            ]}
          >
            <Text style={{ color: ZONE_ACCENT[openZone], fontWeight: "800", fontSize: 11 }}>
              {zoneParts.length}
            </Text>
          </View>
          {usePopupPicker ? (
            <Pressable onPress={closePartPicker} hitSlop={10} accessibilityRole="button">
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.partGrid, { flexDirection: dir }]}>
          {zoneParts.map((part) => {
            const Icon = BODY_PART_ICONS[part];
            const active = selectedPart === part;
            const hasDot = partsWithRecords.has(part);
            const accent = ZONE_ACCENT[openZone];
            return (
              <Pressable
                key={part}
                onPress={() => selectPart(part)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.partTile,
                  usePopupPicker && styles.partTilePopup,
                  {
                    borderColor: active ? accent : colors.border,
                    backgroundColor: active
                      ? `${accent}16`
                      : pressed
                        ? colors.muted
                        : colors.background,
                    transform: pressed ? [{ scale: 0.97 }] : undefined,
                  },
                ]}
              >
                {hasDot ? (
                  <View
                    style={[
                      styles.partRecordDot,
                      isRTL ? { left: 5 } : { right: 5 },
                      { backgroundColor: accent },
                    ]}
                  />
                ) : null}
                <View
                  style={[
                    styles.partIconBubble,
                    usePopupPicker && styles.partIconBubblePopup,
                    {
                      backgroundColor: active ? `${accent}22` : `${colors.foreground}08`,
                    },
                  ]}
                >
                  <BodyPartIcon
                    icon={Icon}
                    size={usePopupPicker ? 20 : 16}
                    color={active ? accent : colors.foreground}
                  />
                </View>
                <Text
                  numberOfLines={2}
                  style={{
                    color: active ? accent : colors.foreground,
                    fontWeight: active ? "800" : "600",
                    fontSize: usePopupPicker ? 11 : 10,
                    textAlign: "center",
                    lineHeight: usePopupPicker ? 14 : 12,
                  }}
                >
                  {t.records.bodyParts[part]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </>
    ) : null;

  return (
    <View
      style={[styles.wrap, !isDesktop && styles.wrapMobile]}
      onLayout={onPaneLayout}
    >
      {isDesktop ? (
        <>
          <View style={[styles.chipRow, { flexDirection: dir }]}>
            {chip(null, t.records.bodyPartAll, !selectedPart && !openZone)}
            {BODY_ZONES.map((zone) => {
              const ZoneIcon = BODY_ZONE_ICONS[zone];
              const active = openZone === zone;
              const accent = ZONE_ACCENT[zone];
              return (
                <Pressable
                  key={zone}
                  onPress={() => selectZone(zone)}
                  style={[
                    styles.zoneChip,
                    {
                      flexDirection: dir,
                      borderColor: active ? accent : colors.border,
                      backgroundColor: active ? `${accent}18` : colors.muted,
                    },
                  ]}
                >
                  <View style={[styles.zoneDot, { backgroundColor: accent }]} />
                  <ZoneIcon
                    width={14}
                    height={14}
                    color={active ? accent : colors.foreground}
                  />
                  <Text
                    style={{
                      color: active ? accent : colors.foreground,
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    {t.records.bodyZones[zone]}
                    {zonesWithRecords.has(zone) ? " •" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!openZone ? (
            <Text
              style={[
                styles.hint,
                { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t.records.bodyZoneHint}
            </Text>
          ) : null}
        </>
      ) : null}

      <View
        style={isDesktop ? styles.diagramCard : [styles.diagramCardMobile, mobileBoxStyle]}
        onLayout={onDiagramLayout}
      >
        {figureWidth > 0 && figureHeight > 0 ? (
          <BodyAnatomyFigure
            width={figureWidth}
            height={figureHeight}
            openZone={openZone}
            zonesWithRecords={zonesWithRecords}
            zoneLabels={t.records.bodyZones}
            onSelectZone={selectZone}
            foreground={colors.foreground}
            mutedForeground={colors.mutedForeground}
            cardBg={colors.card}
            border={colors.border}
            isRTL={isRTL}
            compact={!isDesktop}
          />
        ) : null}
      </View>

      {!usePopupPicker && openZone ? (
        <View
          style={[
            styles.partListCard,
            {
              borderColor: `${ZONE_ACCENT[openZone]}33`,
              backgroundColor: colors.card,
            },
          ]}
        >
          {partPickerContent}
        </View>
      ) : null}

      {usePopupPicker ? (
        <Modal
          visible={!!openZone}
          transparent
          animationType="slide"
          onRequestClose={closePartPicker}
        >
          <Pressable style={styles.popupBackdrop} onPress={closePartPicker}>
            <Pressable
              style={[
                styles.popupSheet,
                {
                  backgroundColor: colors.card,
                  borderColor: openZone ? `${ZONE_ACCENT[openZone]}44` : colors.border,
                },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.popupHandle, { backgroundColor: colors.border }]} />
              {partPickerContent}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    gap: 6,
    paddingBottom: 20,
  },
  wrapMobile: {
    flexGrow: 0,
    flexShrink: 0,
    width: "100%",
    alignItems: "center",
  },
  chipRow: {
    gap: 6,
    flexWrap: "wrap",
    flexShrink: 0,
    width: "100%",
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  zoneChip: {
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  zoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hint: {
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 0,
  },
  diagramCard: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    backgroundColor: "transparent",
    overflow: "hidden",
    borderWidth: 0,
  },
  diagramCardMobile: {
    flexGrow: 0,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    overflow: "visible",
  },
  partListCard: {
    flexShrink: 0,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 14,
    marginBottom: 8,
    gap: 6,
  },
  partListHeader: {
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  partListAccent: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 999,
    minHeight: 24,
  },
  partListHeaderText: {
    flex: 1,
    gap: 1,
  },
  partListEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  partListTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  partCountPill: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  partGrid: {
    flexWrap: "wrap",
    gap: 5,
  },
  partTile: {
    flexBasis: "15%",
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 56,
    maxWidth: 78,
    alignItems: "center",
    gap: 3,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 6,
    position: "relative",
  },
  partTilePopup: {
    flexBasis: "30%",
    minWidth: 88,
    maxWidth: "32%",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 14,
  },
  partIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  partIconBubblePopup: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  partRecordDot: {
    position: "absolute",
    top: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  popupBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  popupSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 12,
    maxHeight: "72%",
  },
  popupHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
});
