import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BODY_PARTS, type BodyPart } from "@/domains/medical/bodyParts";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { chatFlexRow } from "@/utils/rtl";

interface Props {
  value?: BodyPart | null;
  onChange: (part: BodyPart) => void;
  label?: string;
}

export function BodyPartPicker({ value, onChange, label }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = chatFlexRow();
  const title = label ?? t.records.bodyPart;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, { flexDirection: dir }]}
        keyboardShouldPersistTaps="handled"
      >
        {BODY_PARTS.map((part) => {
          const active = value === part;
          return (
            <Pressable
              key={part}
              onPress={() => onChange(part)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? `${colors.primary}18` : colors.muted,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.primary : colors.foreground,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {t.records.bodyParts[part]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: "700" },
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
