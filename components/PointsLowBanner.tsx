import { Coins } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";

interface Props {
  isRTL: boolean;
  balance: number;
  messageCost?: number;
}

export function PointsLowBanner({ isRTL, balance, messageCost = 1 }: Props) {
  const colors = useColors();

  if (balance >= 10) return null;

  return (
    <Pressable
      onPress={() => router.push("/(tabs)/points")}
      style={[styles.wrap, { backgroundColor: `${colors.primary}12` }]}
    >
      <Coins size={16} color={colors.primary} />
      <Text style={[styles.text, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
        {balance < 1
          ? isRTL
            ? "لا توجد نقاط كافية لإرسال رسائل. اضغط لإضافة نقاط."
            : "Not enough points to send messages. Tap to add points."
          : isRTL
            ? `رصيدك ${balance} نقاط فقط. كل رسالة تستهلك ${messageCost} نقطة.`
            : `You have only ${balance} points left. Each message costs ${messageCost} point${messageCost === 1 ? "" : "s"}.`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});
