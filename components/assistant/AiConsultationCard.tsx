import { router } from "expo-router";
import { Check, MessageCircle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAsk3elagiAiWidgetStore } from "@/domains/ai/widget-store";
import { useAuthStore } from "@/domains/auth/store";
import { startConsultation } from "@/domains/consultations/api";
import {
  selectPointsBalance,
  usePointsStore,
} from "@/domains/points/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { formatEgp } from "@/utils/credits";
import type { ConsultationDirective } from "@/utils/assistantConsultation";

interface Props {
  directive: ConsultationDirective;
}

export function AiConsultationCard({ directive }: Props) {
  const colors = useColors();
  const { isRTL } = useI18n();
  const token = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const isPatient = role?.toLowerCase() === "patient";
  const closeWidget = useAsk3elagiAiWidgetStore((s) => s.closeWidget);
  const summary = usePointsStore((s) => s.summary);
  const loadPoints = usePointsStore((s) => s.loadPoints);
  const balance = selectPointsBalance(summary);
  const price = Math.min(100_000, Math.max(1, directive.price ?? 1));
  const hasEnoughCredits = balance >= price;

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (token && isPatient) void loadPoints(token);
  }, [token, isPatient, loadPoints]);

  if (!isPatient) return null;

  const handleStart = async () => {
    if (!token || starting) return;
    setStarting(true);
    setError(null);
    try {
      await startConsultation(
        directive.doctorUserId,
        directive.description ?? "",
        token,
      );
      await loadPoints(token);
      setStarted(true);
      closeWidget();
      router.push(`/chat/${directive.doctorUserId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStarting(false);
    }
  };

  if (started) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.background, borderColor: colors.primary },
        ]}
      >
        <View style={styles.confirmedRow}>
          <Check size={18} color={colors.primary} />
          <Text style={[styles.confirmedText, { color: colors.foreground }]}>
            {isRTL
              ? `تم بدء الاستشارة مع ${directive.doctorName ?? "الطبيب"} — جاري فتح المحادثة`
              : `Consultation started with ${directive.doctorName ?? "the doctor"} — opening chat`}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <View style={styles.titleRow}>
        <MessageCircle size={16} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          {directive.doctorName
            ? isRTL
              ? `بدء استشارة مع ${directive.doctorName}`
              : `Start consultation with ${directive.doctorName}`
            : isRTL
              ? "بدء استشارة"
              : "Start consultation"}
        </Text>
      </View>

      {directive.description ? (
        <Text
          style={[
            styles.description,
            {
              color: colors.mutedForeground,
              textAlign: isRTL ? "right" : "left",
            },
          ]}
        >
          {directive.description}
        </Text>
      ) : null}

      <Text
        style={[
          styles.price,
          { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
        ]}
      >
        {isRTL
          ? `التكلفة: ${formatEgp(price)} (تُحجز من رصيدك)`
          : `Cost: ${formatEgp(price)} (reserved from your credits)`}
      </Text>

      {!hasEnoughCredits ? (
        <Text
          style={{
            color: colors.destructive,
            fontWeight: "600",
            marginBottom: 8,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {isRTL
            ? `رصيدك غير كافٍ (${formatEgp(balance)})`
            : `Insufficient credits (${formatEgp(balance)})`}
        </Text>
      ) : null}

      <Pressable
        onPress={() => void handleStart()}
        disabled={starting || !hasEnoughCredits}
        style={[
          styles.confirmBtn,
          {
            backgroundColor: colors.primary,
            opacity: starting || !hasEnoughCredits ? 0.55 : 1,
          },
        ]}
      >
        {starting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmBtnText}>
            {isRTL ? "تأكيد وبدء المحادثة" : "Confirm & open chat"}
          </Text>
        )}
      </Pressable>

      {error ? (
        <Text
          style={{
            color: colors.destructive,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  title: { fontSize: 14, fontWeight: "700", flex: 1 },
  description: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  price: { fontSize: 13, fontWeight: "600", marginBottom: 10 },
  confirmBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  confirmedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  confirmedText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 19 },
});
