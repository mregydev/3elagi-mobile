import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LanguageDropdown } from "@/components/language/LanguageDropdown";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  embedded?: boolean;
  inFooter?: boolean;
  /** Kept for API compatibility — always uses dropdown now. */
  wideCards?: boolean;
}

export function ProfileLanguageField({
  embedded = false,
  inFooter = false,
}: Props) {
  const colors = useColors();
  const { isRTL, t } = useI18n();
  const dir = isRTL ? "row-reverse" : "row";

  if (embedded || inFooter) {
    return (
      <View style={styles.embedded}>
        <Text
          style={[
            styles.embeddedLabel,
            { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t.settings.language}
        </Text>
        <View
          style={[
            styles.embeddedRow,
            { flexDirection: dir, alignSelf: isRTL ? "flex-end" : "flex-start" },
          ]}
        >
          <LanguageDropdown showLabel />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, { flexDirection: dir }, inFooter && styles.footerRow]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {t.settings.language}
      </Text>
      <LanguageDropdown compact />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 14,
    gap: 12,
  },
  footerRow: {
    marginTop: 0,
    marginBottom: 0,
  },
  embedded: {
    gap: 10,
  },
  embeddedLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  embeddedRow: {
    width: "100%",
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
});
