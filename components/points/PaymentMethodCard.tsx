import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PaymentProviderLogo } from "@/components/points/PaymentProviderLogo";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

export type PaymentMethodId = "vodafone_cash" | "fawry" | "credit_card";

interface PaymentMethodCardProps {
  id: PaymentMethodId;
  label: string;
  subtitle: string;
  onPress: () => void;
}

export function PaymentMethodCard({ id, label, subtitle, onPress }: PaymentMethodCardProps) {
  const colors = useColors();
  const { isRTL } = useI18n();
  const dir = isRTL ? "row-reverse" : "row";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.card,
        {
          flexDirection: dir,
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : hovered ? 0.98 : 1,
        },
      ]}
    >
      <PaymentProviderLogo id={id} />
      <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <Text style={[styles.label, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
          {label}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    cursor: "pointer" as "auto",
  },
  label: { fontSize: 16, fontWeight: "800" },
  subtitle: { fontSize: 13, lineHeight: 18 },
});
