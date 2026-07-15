import { Plus } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { flexRow } from "@/utils/rtl";

export const MEDICAL_RECORD_ADD_BAR_HEIGHT = 72;
export const MEDICAL_RECORD_WEB_ADD_BAR_HEIGHT = 80;

export type MedicalRecordAddBarLayout = "dock" | "web-inline" | "web-dock" | "inline";

interface Props {
  onAdd: () => void;
  layout?: MedicalRecordAddBarLayout;
  /** Kept for call-site compatibility; category choice happens on the add form. */
  showDiagnosis?: boolean;
}

export function MedicalRecordAddBar({ onAdd, layout = "dock" }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const isInline = layout === "inline";
  const isWebInline = layout === "web-inline";
  const isWebDock = layout === "web-dock";
  const isDesktopWeb = isWebInline || isWebDock;
  const flushWebDock = Platform.OS === "web" && layout === "dock";

  const dockStyle: ViewStyle | undefined =
    layout === "dock"
      ? {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }
      : isWebDock
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
        isInline && styles.shellInline,
        isWebInline && styles.shellWebInline,
        flushWebDock && styles.shellWebDock,
        isWebDock && styles.shellWebDocked,
        isDesktopWeb && styles.shellDesktop,
        dockStyle,
        {
          backgroundColor: layout === "dock" || isWebDock ? colors.card : "transparent",
          borderTopColor: colors.border,
          shadowColor: colors.foreground,
          alignItems: isDesktopWeb ? "center" : undefined,
        },
      ]}
    >
      <Pressable
        onPress={onAdd}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          styles.addBtn,
          isDesktopWeb && styles.addBtnDesktop,
          {
            flexDirection: dir,
            backgroundColor: pressed ? colors.primary : colors.primary,
            opacity: pressed ? 0.9 : 1,
            transform: hovered && !pressed ? [{ translateY: -1 }] : undefined,
            shadowColor: colors.primary,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t.records.addMedicalRecord}
      >
        <View style={styles.plusCircle}>
          <Plus size={18} color={colors.primary} strokeWidth={2.6} />
        </View>
        <Text style={styles.addLabel} numberOfLines={1}>
          {t.records.addMedicalRecord}
        </Text>
      </Pressable>
    </View>
  );
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
  shellDesktop: {
    width: "100%",
  },
  addBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    cursor: "pointer" as "auto",
  },
  addBtnDesktop: {
    width: 300,
    alignSelf: "center",
  },
  plusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
