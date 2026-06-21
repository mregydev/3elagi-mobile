import { Plus } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import {
  getAddMedicalCategories,
  getLocalizedCategoryLabel,
} from "@/components/records/medicalRecordCategories";
import type { MedicalCategory } from "@/domains/medical/types";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { flexRow } from "@/utils/rtl";

export const MEDICAL_RECORD_ADD_BAR_HEIGHT = 64;

export type MedicalRecordAddBarLayout = "dock" | "web-inline" | "web-dock";

interface Props {
  onAdd: (category: MedicalCategory) => void;
  layout?: MedicalRecordAddBarLayout;
  /** When true, shows diagnosis among add options (doctors only). */
  showDiagnosis?: boolean;
}

export function MedicalRecordAddBar({
  onAdd,
  layout = "dock",
  showDiagnosis = false,
}: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const categories = getAddMedicalCategories(showDiagnosis);

  const dockStyle: ViewStyle | undefined =
    layout === "dock"
      ? {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }
      : layout === "web-dock"
        ? {
            width: "100%",
            maxWidth: WEB_MAX_WIDTH.content,
            alignSelf: "center",
          }
        : undefined;

  return (
    <View
      style={[
        styles.wrap,
        layout === "web-inline" && styles.wrapWebInline,
        dockStyle,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderColor: colors.border,
          shadowColor: colors.foreground,
        },
      ]}
    >
      <View style={[styles.tray, { backgroundColor: colors.muted }]}>
        <View style={[styles.row, { flexDirection: dir }]}>
          {categories.map(({ key, Icon, color }) => (
            <Pressable
              key={key}
              onPress={() => onAdd(key)}
              style={({ pressed }) => [
                styles.action,
                layout === "web-inline" && [styles.actionWeb, { flexDirection: dir }],
                {
                  backgroundColor: pressed ? colors.card : "transparent",
                },
                pressed && styles.actionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={getLocalizedCategoryLabel(key, t)}
            >
              <View style={styles.iconSlot}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Icon size={18} color={color} strokeWidth={2.2} />
                </View>
                <View
                  style={[
                    styles.plusBadge,
                    isRTL ? styles.plusBadgeRtl : styles.plusBadgeLtr,
                    { backgroundColor: color, borderColor: colors.muted },
                  ]}
                >
                  <Plus size={10} color="#fff" strokeWidth={3} />
                </View>
              </View>
              <Text
                style={[
                  styles.actionLabel,
                  layout === "web-inline" && styles.actionLabelWeb,
                  { color: colors.mutedForeground },
                ]}
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

const styles = StyleSheet.create({
  wrap: {
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
  wrapWebInline: {
    borderTopWidth: 0,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 4,
  },
  tray: {
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  row: {
    gap: 4,
    alignItems: "stretch",
  },
  action: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 4,
    borderRadius: 10,
  },
  actionWeb: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: "center",
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
  actionLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 12,
  },
  actionLabelWeb: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
});
