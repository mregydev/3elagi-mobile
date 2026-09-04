import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { TourAnchor } from "@/components/onboarding/TourAnchor";
import { chatFlexRow } from "@/utils/rtl";

export type RecordsViewMode = "table" | "skeleton";

interface Props {
  mode: RecordsViewMode;
  onChange: (mode: RecordsViewMode) => void;
}

export function RecordsViewModeToggle({ mode, onChange }: Props) {
  const colors = useColors();
  const { t } = useI18n();
  const dir = chatFlexRow();

  return (
    <View style={[styles.row, { flexDirection: dir, borderColor: colors.border, backgroundColor: colors.muted }]}>
      {(
        [
          { key: "table" as const, label: t.records.tableView },
          { key: "skeleton" as const, label: t.records.skeletonView },
        ] as const
      ).map((opt) => {
        const active = mode === opt.key;
        const chip = (
          <Text
            style={{
              color: active ? colors.primary : colors.mutedForeground,
              fontWeight: "800",
              fontSize: 13,
            }}
          >
            {opt.label}
          </Text>
        );
        if (opt.key === "skeleton") {
          return (
            <TourAnchor
              key={opt.key}
              id="records-skeleton-toggle"
              testID="records-skeleton-toggle"
              pressable
              onPress={() => onChange(opt.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.card : "transparent",
                  borderColor: active ? colors.border : "transparent",
                },
              ]}
            >
              {chip}
            </TourAnchor>
          );
        }
        return (
          <Pressable
            key={opt.key}
            testID="records-table-toggle"
            onPress={() => onChange(opt.key)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.card : "transparent",
                borderColor: active ? colors.border : "transparent",
              },
            ]}
          >
            {chip}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: "flex-start",
    gap: 4,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
  },
  chip: {
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
