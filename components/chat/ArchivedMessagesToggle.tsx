import { ChevronDown, ChevronUp, Archive } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { chatFlexRow } from "@/utils/rtl";

type Props = {
  count: number;
  expanded: boolean;
  isRTL: boolean;
  onToggle: () => void;
  label: string;
  countLabel: (count: number) => string;
};

export function ArchivedMessagesToggle({
  count,
  expanded,
  isRTL,
  onToggle,
  label,
  countLabel,
}: Props) {
  const colors = useColors();
  const rowDir = chatFlexRow();
  const Chevron = expanded ? ChevronUp : ChevronDown;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      style={({ pressed }) => [
        styles.row,
        {
          flexDirection: rowDir,
          backgroundColor: pressed ? `${colors.muted}` : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.left, { flexDirection: rowDir }]}>
        <Archive size={15} color={colors.mutedForeground} />
        <Text
          style={[
            styles.label,
            { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {label}
        </Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {countLabel(count)}
        </Text>
      </View>
      <Chevron size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  left: { flex: 1, alignItems: "center", gap: 8 },
  label: { fontSize: 13, fontWeight: "700" },
  count: { fontSize: 12, fontWeight: "600" },
});
