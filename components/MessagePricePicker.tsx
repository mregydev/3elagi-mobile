import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  value: number;
  onChange: (value: number) => void;
  isRTL: boolean;
  dir: "row" | "row-reverse";
  label: string;
  hint?: string;
  compact?: boolean;
  dense?: boolean;
}

const OPTIONS = [1, 2, 3, 4, 5];

export function MessagePricePicker({
  value,
  onChange,
  isRTL,
  dir,
  label,
  hint,
  compact = false,
  dense = false,
}: Props) {
  const colors = useColors();
  const chipStyle = dense ? styles.denseChip : styles.compactChip;
  const chipFontSize = dense ? 12 : 13;

  if (compact) {
    return (
      <View style={[styles.compactBlock, dense && styles.compactBlockDense]}>
        <Text
          style={[
            dense ? styles.denseLabel : styles.compactLabel,
            { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {label}
        </Text>
        <View style={[styles.row, dense && styles.denseRow, { flexDirection: dir }]}>
          {OPTIONS.map((n) => {
            const active = value === n;
            return (
              <Pressable
                key={n}
                onPress={() => onChange(n)}
                style={[
                  chipStyle,
                  {
                    backgroundColor: active ? colors.primary : colors.muted,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? "#fff" : colors.foreground,
                    fontWeight: "800",
                    fontSize: chipFontSize,
                  }}
                >
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.foreground, fontWeight: "700", textAlign: isRTL ? "right" : "left" }}>
        {label}
      </Text>
      {hint ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: isRTL ? "right" : "left" }}>
          {hint}
        </Text>
      ) : null}
      <View style={[styles.row, { flexDirection: dir }]}>
        {OPTIONS.map((n) => {
          const active = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.muted,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={{ color: active ? "#fff" : colors.foreground, fontWeight: "800" }}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactBlock: {
    gap: 4,
  },
  compactBlockDense: {
    gap: 2,
  },
  compactLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  denseLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
  row: { gap: 8, flexWrap: "wrap" },
  denseRow: { gap: 6, flexWrap: "nowrap" },
  chip: {
    minWidth: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  compactChip: {
    minWidth: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  denseChip: {
    minWidth: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
