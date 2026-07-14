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
import { flexRow } from "@/utils/rtl";

export const MEDICAL_RECORD_ADD_BAR_HEIGHT = 88;
export const MEDICAL_RECORD_WEB_ADD_BAR_HEIGHT = 96;

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

function AddAction({
  categoryKey,
  color,
  Icon,
  label,
  onPress,
  isRTL,
  compact,
}: {
  categoryKey: MedicalCategory;
  color: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
  isRTL: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      key={categoryKey}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        compact ? styles.actionCompact : styles.action,
        {
          backgroundColor: pressed ? `${color}22` : `${color}12`,
          borderColor: `${color}28`,
          transform: hovered && !pressed ? [{ translateY: -3 }, { scale: 1.02 }] : undefined,
          shadowColor: color,
          shadowOpacity: hovered ? 0.22 : 0.1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.accentRail, { backgroundColor: color }]} />
      <View style={styles.iconSlot}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: color,
              shadowColor: color,
            },
          ]}
        >
          <Icon size={compact ? 16 : 18} color="#fff" strokeWidth={2.3} />
        </View>
        <View
          style={[
            styles.plusBadge,
            isRTL ? styles.plusBadgeRtl : styles.plusBadgeLtr,
            { borderColor: color },
          ]}
        >
          <Plus size={9} color={color} strokeWidth={3.4} />
        </View>
      </View>
      <Text style={[styles.actionLabel, { color }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function MobileAddBar({ onAdd, layout, showDiagnosis }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const categories = getAddMedicalCategories(showDiagnosis);
  const flushWebDock = Platform.OS === "web" && layout === "dock";
  const isInline = layout === "inline";

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
        styles.shell,
        isInline && styles.shellInline,
        flushWebDock && styles.shellWebDock,
        dockStyle,
        {
          backgroundColor: layout === "dock" ? colors.card : "transparent",
          borderTopColor: colors.border,
          shadowColor: colors.foreground,
        },
      ]}
    >
      <View
        style={[
          styles.tray,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.foreground,
          },
        ]}
      >
        <View style={[styles.row, { flexDirection: dir }]}>
          {categories.map(({ key, Icon, color }) => (
            <AddAction
              key={key}
              categoryKey={key}
              color={color}
              Icon={Icon}
              label={getLocalizedCategoryLabel(key, t)}
              onPress={() => onAdd(key)}
              isRTL={isRTL}
              compact
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function WebAddBar({ onAdd, layout, showDiagnosis }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
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
        styles.shell,
        isWebInline && styles.shellWebInline,
        layout === "web-dock" && styles.shellWebDocked,
        dockStyle,
        {
          backgroundColor: layout === "web-dock" ? colors.card : "transparent",
          borderTopColor: colors.border,
          shadowColor: colors.foreground,
        },
      ]}
    >
      <View
        style={[
          styles.tray,
          styles.trayWeb,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.foreground,
          },
        ]}
      >
        <View style={[styles.row, { flexDirection: dir }]}>
          {categories.map(({ key, Icon, color }) => (
            <AddAction
              key={key}
              categoryKey={key}
              color={color}
              Icon={Icon}
              label={getLocalizedAddLabel(key, t)}
              onPress={() => onAdd(key)}
              isRTL={isRTL}
            />
          ))}
        </View>
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
  shell: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 100,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  shellInline: {
    borderTopWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 0,
    shadowOpacity: 0,
    elevation: 0,
    marginTop: 12,
    marginBottom: 4,
  },
  shellWebInline: {
    borderTopWidth: 0,
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  shellWebDock: {
    paddingBottom: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  shellWebDocked: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  tray: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 8,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  trayWeb: {
    padding: 10,
  },
  row: {
    gap: 8,
    alignItems: "stretch",
  },
  action: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 76,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    cursor: "pointer" as "auto",
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  actionCompact: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 64,
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  accentRail: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  iconSlot: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  plusBadge: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  plusBadgeLtr: {
    right: -3,
    bottom: -2,
  },
  plusBadgeRtl: {
    left: -3,
    bottom: -2,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 15,
    letterSpacing: 0.1,
  },
});
