import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@/domains/auth/store";
import { usePointsStore } from "@/domains/points/store";

const EMPTY_SUMMARY = {
  message_points: 0,
  points_spent_total: 0,
  points_purchased_total: 0,
};

export function usePointsPage(isRTL: boolean) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const summary = usePointsStore((s) => s.summary);
  const loading = usePointsStore((s) => s.loading);
  const loadPoints = usePointsStore((s) => s.loadPoints);
  const addPoints = usePointsStore((s) => s.addPoints);

  const [amountText, setAmountText] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (accessToken) void loadPoints(accessToken);
    }, [accessToken, loadPoints]),
  );

  const displaySummary = summary ?? EMPTY_SUMMARY;

  const submitAdd = async (rawAmount?: number) => {
    const amount =
      rawAmount ?? parseInt(amountText.trim(), 10);

    if (!accessToken || !Number.isFinite(amount) || amount < 1) {
      Alert.alert(
        isRTL ? "مبلغ غير صالح" : "Invalid amount",
        isRTL ? "أدخل عددًا صحيحًا أكبر من صفر." : "Enter a whole number greater than zero.",
      );
      return false;
    }

    setSaving(true);
    try {
      await addPoints(accessToken, amount);
      setAmountText("");
      Alert.alert(
        isRTL ? "تمت الإضافة" : "Points added",
        isRTL
          ? `تمت إضافة ${amount} نقطة إلى رصيدك.`
          : `${amount} points were added to your balance.`,
      );
      return true;
    } catch (e) {
      Alert.alert(
        isRTL ? "تعذر الإضافة" : "Could not add points",
        e instanceof Error ? e.message : isRTL ? "حاول مرة أخرى." : "Please try again.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    accessToken,
    summary,
    loading,
    saving,
    displaySummary,
    amountText,
    setAmountText,
    submitAdd,
  };
}
