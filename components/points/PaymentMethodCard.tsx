import { CreditCard } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export type PaymentMethodId = "vodafone_cash" | "fawry" | "credit_card";

interface PaymentMethodCardProps {
  id: PaymentMethodId;
  label: string;
  subtitle: string;
  onPress: () => void;
}

function VodafoneLogo() {
  return (
    <View style={[styles.logo, { backgroundColor: "#e60000" }]}>
      <Text style={styles.logoText}>VF</Text>
    </View>
  );
}

function FawryLogo() {
  return (
    <View style={[styles.logo, { backgroundColor: "#ffb800" }]}>
      <Text style={[styles.logoText, { color: "#1a1a1a" }]}>F</Text>
    </View>
  );
}

function CreditLogo() {
  return (
    <View style={[styles.logo, { backgroundColor: "#3057F2" }]}>
      <CreditCard size={22} color="#fff" />
    </View>
  );
}

export function PaymentMethodCard({ id, label, subtitle, onPress }: PaymentMethodCardProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {id === "vodafone_cash" ? (
        <VodafoneLogo />
      ) : id === "fawry" ? (
        <FawryLogo />
      ) : (
        <CreditLogo />
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },
  label: { fontSize: 16, fontWeight: "800" },
  subtitle: { fontSize: 13 },
});
