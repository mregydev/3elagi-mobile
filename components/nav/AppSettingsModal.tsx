import { Languages, Palette, SunMoon, X } from "lucide-react-native";
import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { AccentPicker } from "@/components/AccentPicker";
import { LanguageDropdown } from "@/components/language/LanguageDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { alignText, flexRow } from "@/utils/rtl";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AppSettingsModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.panel,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={[styles.header, { flexDirection: dir, borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground, textAlign }]}>
              {t.settings.preferences}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.common.cancel}
              hitSlop={10}
              style={({ pressed, hovered }) => [
                styles.closeBtn,
                { backgroundColor: pressed || hovered ? colors.muted : "transparent" },
              ]}
            >
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <SettingRow
              icon={<Languages size={18} color={colors.mutedForeground} />}
              label={t.settings.language}
              dir={dir}
              textAlign={textAlign}
              colors={colors}
              isLast={false}
            >
              <LanguageDropdown compact placement="bottom" />
            </SettingRow>

            <SettingRow
              icon={<SunMoon size={18} color={colors.mutedForeground} />}
              label={t.settings.theme}
              dir={dir}
              textAlign={textAlign}
              colors={colors}
              isLast={false}
            >
              <ThemeToggle />
            </SettingRow>

            <SettingRow
              icon={<Palette size={18} color={colors.mutedForeground} />}
              label={t.settings.accentColor}
              dir={dir}
              textAlign={textAlign}
              colors={colors}
              isLast
            >
              <AccentPicker />
            </SettingRow>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SettingRow({
  icon,
  label,
  children,
  dir,
  textAlign,
  colors,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  dir: "row" | "row-reverse";
  textAlign: "left" | "right";
  colors: ReturnType<typeof useColors>;
  isLast: boolean;
}) {
  return (
    <View
      style={[
        styles.settingRow,
        { flexDirection: dir, borderBottomColor: colors.border },
        isLast && styles.settingRowLast,
      ]}
    >
      {icon}
      <Text style={[styles.settingLabel, { color: colors.foreground, textAlign, flex: 1 }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  panel: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 24px 48px rgba(0,0,0,0.18)" } as object,
      default: {},
    }),
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: "800", flex: 1 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flexShrink: 0,
  },
  settingRow: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLabel: { fontSize: 15, fontWeight: "500" },
});
