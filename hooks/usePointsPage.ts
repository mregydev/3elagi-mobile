import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { useAuthStore } from "@/domains/auth/store";
import { usePointsStore } from "@/domains/points/store";
import { showErrorToast } from "@/utils/toast";

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

  const [amountText, setAmountText] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (accessToken) void loadPoints(accessToken);
    }, [accessToken, loadPoints]),
  );

  const displaySummary = summary ?? EMPTY_SUMMARY;

  const parseAmount = (rawAmount?: number): number | null => {
    const amount = rawAmount ?? parseInt(amountText.trim(), 10);
    if (!Number.isFinite(amount) || amount < 1) {
      showErrorToast(
        isRTL ? "مبلغ غير صالح" : "Invalid amount",
        isRTL ? "أدخل عددًا صحيحًا أكبر من صفر." : "Enter a whole number greater than zero.",
      );
      return null;
    }
    return amount;
  };

  return {
    accessToken,
    summary,
    loading,
    displaySummary,
    amountText,
    setAmountText,
    parseAmount,
  };
}
