import React, { useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import { RotateCcw, X } from "lucide-react-native";
import {
  BodyAnatomyFigure,
  type ZoneTapAnchor,
} from "@/components/records/BodyAnatomyFigure";
import { BODY_PART_ICONS, BodyPartIcon } from "@/components/records/bodyPartIcons";
import {
  BODY_PARTS_BY_ZONE,
  type BodyPart,
  type BodyZone,
} from "@/domains/medical/bodyParts";
import type { MedicalRecord } from "@/domains/medical/types";
import { WEB_BREAKPOINTS } from "@/constants/webLayout";
import { recordsBottomChromeHeight } from "@/components/records/RecordsBottomChrome";
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
  head_neck: "#6366F1",
  chest: "#0EA5E9",
  abdomen: "#0D9488",
  pelvis: "#A855F7",
  left_arm: "#F59E0B",
  right_arm: "#D97706",
  left_leg: "#EA580C",
  right_leg: "#C2410C",
};

const DESKTOP_FIGURE_HEIGHT_RATIO = 0.72;
/** Fallback when parent hasn't laid out yet — leave room for header + add bar. */
const MOBILE_FIGURE_HEIGHT_RATIO = 0.52;
const MOBILE_FIGURE_WIDTH_RATIO = 0.96;

const MENU_WIDTH = 280;
const MENU_EST_HEIGHT = 320;
const MENU_PAD = 12;

/** Prefer filling the parent pane; fallback fraction of viewport. */
export function bodyFigureViewportHeight(
  screenHeight: number,
  screenWidth: number,
): number {
  const isDesktop = screenWidth >= WEB_BREAKPOINTS.desktop;
  if (isDesktop) {
    return Math.round(screenHeight * DESKTOP_FIGURE_HEIGHT_RATIO);
  }
  const chrome = recordsBottomChromeHeight({ canAdd: true, extra: 24 });
  const usable = Math.max(240, screenHeight - chrome);
  return Math.round(usable * MOBILE_FIGURE_HEIGHT_RATIO);
}

/** Mobile / mobile-web skeleton width target (viewport fraction). */
export function bodyFigureViewportWidth(screenWidth: number): number {
  return Math.round(screenWidth * MOBILE_FIGURE_WIDTH_RATIO);
}

function clampMenuPosition(
  anchor: ZoneTapAnchor,
  screenW: number,
  screenH: number,
): { left: number; top: number } {
  const left = Math.min(
    Math.max(MENU_PAD, anchor.x - MENU_WIDTH / 2),
    screenW - MENU_WIDTH - MENU_PAD,
  );
  const preferBelow = anchor.y + 8 + MENU_EST_HEIGHT < screenH - MENU_PAD;
  const top = preferBelow
    ? Math.min(anchor.y + 8, screenH - MENU_EST_HEIGHT - MENU_PAD)
    : Math.max(MENU_PAD, anchor.y - MENU_EST_HEIGHT - 8);
  return { left, top };
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
  const { width, height: screenHeight } = useWindowDimensions();
  const [paneWidth, setPaneWidth] = useState(0);
  const [diagramH, setDiagramH] = useState(0);
  const [diagramW, setDiagramW] = useState(0);
  const [openZone, setOpenZone] = useState<BodyZone | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<ZoneTapAnchor | null>(null);

  const partsWithRecords = useMemo(() => {
    const set = new Set<BodyPart>();
    for (const r of records) {
      if (r.bodyPart) set.add(r.bodyPart);
    }
    return set;
  }, [records]);

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

  const fallbackMobileH = Math.max(220, bodyFigureViewportHeight(screenHeight, width));
  const fallbackMobileW = Math.max(160, bodyFigureViewportWidth(width));
  const parentW = paneWidth > 0 ? paneWidth : Math.round(width * (isDesktop ? 0.5 : 0.96));

  const figureHeight = isDesktop
    ? Math.max(180, diagramH > 0 ? diagramH : Math.round(screenHeight * DESKTOP_FIGURE_HEIGHT_RATIO))
    : Math.max(180, diagramH > 0 ? diagramH : fallbackMobileH);
  const figureWidth = isDesktop
    ? Math.max(180, diagramW > 0 ? diagramW : Math.round(parentW * 0.98))
    : Math.max(160, diagramW > 0 ? diagramW : fallbackMobileW);

  const mobileBoxStyle: ViewStyle = {
    width: "100%",
    flex: 1,
    minHeight: 0,
    alignSelf: "stretch",
  };

  const closePartPicker = () => {
    setOpenZone(null);
    setMenuAnchor(null);
  };

  const selectPart = (part: BodyPart) => {
    if (onOpenPart) {
      onSelectPart(part);
      onOpenPart(part);
      closePartPicker();
      return;
    }
    const next = selectedPart === part ? null : part;
    onSelectPart(next);
    closePartPicker();
  };

  const selectZone = (zone: BodyZone, anchor: ZoneTapAnchor) => {
    const parts = BODY_PARTS_BY_ZONE[zone];
    // Single-organ zones (e.g. left foot) select immediately — no menu needed.
    if (parts.length === 1) {
      selectPart(parts[0]);
      return;
    }
    if (openZone === zone) {
      closePartPicker();
      return;
    }
    setOpenZone(zone);
    setMenuAnchor({
      x: Number.isFinite(anchor.x) ? anchor.x : width / 2,
      y: Number.isFinite(anchor.y) ? anchor.y : screenHeight / 2,
    });
  };

  const zoneParts = openZone ? BODY_PARTS_BY_ZONE[openZone] : [];
  const menuPos =
    menuAnchor != null
      ? clampMenuPosition(menuAnchor, width, screenHeight)
      : { left: MENU_PAD, top: MENU_PAD };

  return (
    <View
      style={[styles.wrap, !isDesktop && styles.wrapMobile]}
      onLayout={onPaneLayout}
    >
      <View style={[styles.toolbar, { flexDirection: dir }]}>
        <View style={[styles.selectionRow, { flexDirection: dir, flex: 1 }]}>
          <Text
            style={[
              styles.selectionLabel,
              {
                color: selectedPart ? colors.foreground : colors.mutedForeground,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
            numberOfLines={1}
          >
            {selectedPart && selectedPart !== "general"
              ? `${t.records.bodyPart}: ${t.records.bodyParts[selectedPart]}`
              : t.records.bodyZoneHint}
          </Text>
          {selectedPart ? (
            <Pressable
              onPress={() => {
                onSelectPart(null);
                closePartPicker();
              }}
              accessibilityRole="button"
              accessibilityLabel={t.records.bodyPartReset}
              style={[
                styles.resetBtn,
                {
                  flexDirection: dir,
                  borderColor: colors.border,
                  backgroundColor: colors.muted,
                },
              ]}
            >
              <RotateCcw size={14} color={colors.foreground} />
              <Text
                style={{
                  color: colors.foreground,
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                {t.records.bodyPartReset}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View
        style={isDesktop ? styles.diagramCard : [styles.diagramCardMobile, mobileBoxStyle]}
        onLayout={onDiagramLayout}
      >
        {figureWidth > 0 && figureHeight > 0 ? (
          <BodyAnatomyFigure
            width={figureWidth}
            height={figureHeight}
            zoneLabels={t.records.bodyZones}
            onSelectZone={selectZone}
            compact={!isDesktop}
          />
        ) : null}
      </View>

      <Modal
        visible={openZone != null}
        transparent
        animationType="fade"
        onRequestClose={closePartPicker}
      >
        <View style={styles.menuRoot} pointerEvents="box-none">
          <Pressable style={styles.menuBackdrop} onPress={closePartPicker} />
          {openZone != null ? (
            <View
              style={[
                styles.contextMenu,
                {
                  left: menuPos.left,
                  top: menuPos.top,
                  width: Math.min(MENU_WIDTH, width - MENU_PAD * 2),
                  backgroundColor: colors.card,
                  borderColor: `${ZONE_ACCENT[openZone]}55`,
                },
              ]}
            >
              <View style={[styles.partListHeader, { flexDirection: dir }]}>
                <View
                  style={[
                    styles.partListAccent,
                    { backgroundColor: ZONE_ACCENT[openZone] },
                  ]}
                />
                <View style={styles.partListHeaderText}>
                  <Text
                    style={[
                      styles.partListEyebrow,
                      {
                        color: ZONE_ACCENT[openZone],
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t.records.bodyZones[openZone]}
                  </Text>
                  <Text
                    style={[
                      styles.partListTitle,
                      {
                        color: colors.foreground,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t.records.bodyZonePick}
                  </Text>
                </View>
                <Pressable
                  onPress={closePartPicker}
                  hitSlop={10}
                  accessibilityRole="button"
                >
                  <X size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.partScroll}
                contentContainerStyle={[styles.partGrid, { flexDirection: dir }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
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
                          {
                            backgroundColor: active
                              ? `${accent}22`
                              : `${colors.foreground}08`,
                          },
                        ]}
                      >
                        <BodyPartIcon
                          icon={Icon}
                          size={18}
                          color={active ? accent : colors.foreground}
                        />
                      </View>
                      <Text
                        numberOfLines={2}
                        style={{
                          color: active ? accent : colors.foreground,
                          fontWeight: active ? "800" : "600",
                          fontSize: 11,
                          textAlign: "center",
                          lineHeight: 14,
                        }}
                      >
                        {t.records.bodyParts[part]}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    gap: 6,
    paddingBottom: 8,
  },
  wrapMobile: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    paddingBottom: 4,
  },
  toolbar: {
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
    width: "100%",
    paddingHorizontal: 2,
  },
  selectionRow: {
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  selectionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 0,
  },
  resetBtn: {
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    flex: 1,
    minHeight: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  menuRoot: {
    flex: 1,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.28)",
  },
  contextMenu: {
    position: "absolute",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
    maxHeight: "70%",
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
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
  partScroll: {
    maxHeight: 280,
  },
  partGrid: {
    flexWrap: "wrap",
    gap: 6,
  },
  partTile: {
    flexBasis: "30%",
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 72,
    maxWidth: "32%",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 8,
    position: "relative",
  },
  partIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  partRecordDot: {
    position: "absolute",
    top: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
