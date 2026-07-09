import { Plus } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import {
  getAddMedicalCategories,
  getLocalizedAddLabel,
  getLocalizedCategoryLabel,
} from "@/components/records/medicalRecordCategories";
import type { MedicalCategory } from "@/domains/medical/types";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { alignText, flexRow } from "@/utils/rtl";

export const MEDICAL_RECORD_ADD_BAR_HEIGHT = 64;
export const MEDICAL_RECORD_WEB_ADD_BAR_HEIGHT = 88;

export type MedicalRecordAddBarLayout = "dock" | "web-inline" | "web-dock" | "inline";

interface Props {
  onAdd: (category: MedicalCategory) => void;
  layout?: MedicalRecordAddBarLayout;
  /** When true, shows diagnosis among add options (doctors only). */
  showDiagnosis?: boolean;
}

function isWebLayout(layout: MedicalRecordAddBarLayout): boolean {
  return layout === "web-inline" || layout === "web-dock";
}

function MobileAddBar({
  onAdd,
  layout,
  showDiagnosis,
}: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const categories = getAddMedicalCategories(showDiagnosis);
  const flushWebDock = Platform.OS === "web" && layout === "dock";

  const dockStyle: ViewStyle | undefined =
    layout === "dock"
      ? {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }
      : undefined;

  return (
    <View
      style={[
        styles.mobileWrap,
        layout === "inline" && styles.mobileWrapInline,
        flushWebDock && styles.mobileWrapWebDock,
        dockStyle,
        {
          backgroundColor: layout === "dock" ? colors.card : "transparent",
          borderTopColor: colors.border,
          shadowColor: colors.foreground,
        },
      ]}
    >
      <View style={[styles.tray, { backgroundColor: colors.muted }]}>
        <View style={[styles.mobileRow, { flexDirection: dir }]}>
          {categories.map(({ key, Icon, color }) => (
            <Pressable
              key={key}
              onPress={() => onAdd(key)}
              style={({ pressed }) => [
                styles.mobileAction,
                { backgroundColor: `${color}14`, borderColor: `${color}33` },
                pressed && styles.actionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={getLocalizedCategoryLabel(key, t)}
            >
              <View style={styles.iconSlot}>
                <View style={[styles.iconCircle, { backgroundColor: color }]}>
                  <Icon size={18} color="#fff" strokeWidth={2.2} />
                </View>
                <View
                  style={[
                    styles.plusBadge,
                    isRTL ? styles.plusBadgeRtl : styles.plusBadgeLtr,
                    { backgroundColor: "#fff", borderColor: `${color}14` },
                  ]}
                >
                  <Plus size={10} color={color} strokeWidth={3.2} />
                </View>
              </View>
              <Text
                style={[styles.mobileActionLabel, { color }]}
                numberOfLines={1}
              >
                {getLocalizedCategoryLabel(key, t)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function WebAddBar({
  onAdd,
  layout,
  showDiagnosis,
}: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const categories = getAddMedicalCategories(showDiagnosis);
  const isWebInline = layout === "web-inline";

  const dockStyle: ViewStyle | undefined =
    layout === "web-dock"
      ? {
          width: "100%",
          maxWidth: WEB_MAX_WIDTH.content,
          alignSelf: "center",
        }
      : undefined;

  return (
    <View
      style={[
        styles.webWrap,
        isWebInline && styles.wrapWebInline,
        dockStyle,
        {
          backgroundColor: layout === "web-dock" ? colors.card : "transparent",
          borderTopColor: colors.border,
          borderColor: colors.border,
          shadowColor: colors.foreground,
        },
      ]}
    >
      <View style={[styles.webRow, { flexDirection: dir }]}>
        {categories.map(({ key, Icon, color }) => (
          <Pressable
            key={key}
            onPress={() => onAdd(key)}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.webButton,
              {
                flexDirection: dir,
                backgroundColor: color,
                shadowColor: color,
                opacity: pressed ? 0.9 : 1,
                transform: hovered ? [{ translateY: -2 }] : undefined,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={getLocalizedAddLabel(key, t)}
          >
            <View style={styles.webIconSlot}>
              <View style={styles.webIconBubble}>
                <Icon size={18} color="#fff" strokeWidth={2.4} />
              </View>
              <View
                style={[
                  styles.webPlusBadge,
                  isRTL ? styles.webPlusBadgeRtl : styles.webPlusBadgeLtr,
                ]}
              >
                <Plus size={11} color={color} strokeWidth={3.2} />
              </View>
            </View>
            <Text
              style={[styles.webButtonLabel, { textAlign }]}
              numberOfLines={2}
            >
              {getLocalizedAddLabel(key, t)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function MedicalRecordAddBar(props: Props) {
  if (isWebLayout(props.layout ?? "dock")) {
    return <WebAddBar {...props} />;
  }
  return <MobileAddBar {...props} />;
}

const styles = StyleSheet.create({
  mobileWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 100,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  mobileWrapInline: {
    borderTopWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 0,
    shadowOpacity: 0,
    elevation: 0,
    marginBottom: 12,
  },
  mobileWrapWebDock: {
    paddingBottom: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  tray: {
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  mobileRow: {
    gap: 4,
    alignItems: "stretch",
  },
  mobileAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionPressed: {
    opacity: 0.85,
  },
  iconSlot: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  plusBadge: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  plusBadgeLtr: {
    right: -4,
    bottom: -2,
  },
  plusBadgeRtl: {
    left: -4,
    bottom: -2,
  },
  mobileActionLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 12,
  },
  webWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 100,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  wrapWebInline: {
    borderTopWidth: 0,
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 0,
    shadowOpacity: 0,
    elevation: 0,
    marginBottom: 4,
  },
  webRow: {
    gap: 8,
    alignItems: "stretch",
  },
  webButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    cursor: "pointer" as "auto",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  webIconSlot: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  webIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  webPlusBadge: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  webPlusBadgeLtr: { right: -5, bottom: -3 },
  webPlusBadgeRtl: { left: -5, bottom: -3 },
  webButtonLabel: {
    fontSize: 13.5,
    fontWeight: "800",
    lineHeight: 17,
    color: "#fff",
  },
});
