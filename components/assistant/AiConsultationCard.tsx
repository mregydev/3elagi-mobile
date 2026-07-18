import { router } from "expo-router";
import { Check, FileText, MessageCircle } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAsk3elagiAiWidgetStore } from "@/domains/ai/widget-store";
import { useAuthStore } from "@/domains/auth/store";
import { useChatStore } from "@/domains/chat/store";
import { startConsultation } from "@/domains/consultations/api";
import {
  selectPointsBalance,
  usePointsStore,
} from "@/domains/points/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { formatEgp } from "@/utils/credits";
import type { ConsultationDirective } from "@/utils/assistantConsultation";
import { chatFlexRow } from "@/utils/rtl";

interface Props {
  directive: ConsultationDirective;
}

export function AiConsultationCard({ directive }: Props) {
  const colors = useColors();
  const { isRTL } = useI18n();
  const dir = chatFlexRow();
  const token = useAuthStore((s) => s.accessToken);
  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.role);
  const isPatient = role?.toLowerCase() === "patient";
  const closeWidget = useAsk3elagiAiWidgetStore((s) => s.closeWidget);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const summary = usePointsStore((s) => s.summary);
  const loadPoints = usePointsStore((s) => s.loadPoints);
  const balance = selectPointsBalance(summary);
  const price = Math.min(100_000, Math.max(1, directive.price ?? 1));
  const hasEnoughCredits = balance >= price;

  const suggestedRecords = useMemo(() => directive.records ?? [], [directive.records]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(suggestedRecords.map((r) => r.recordId)),
  );
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set(suggestedRecords.map((r) => r.recordId)));
  }, [suggestedRecords]);

  useEffect(() => {
    if (token && isPatient) void loadPoints(token);
  }, [token, isPatient, loadPoints]);

  if (!isPatient) return null;

  const toggleRecord = (recordId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  };

  const handleStart = async () => {
    if (!token || !profile?.id || starting) return;
    setStarting(true);
    setError(null);
    try {
      await startConsultation(
        directive.doctorUserId,
        directive.description ?? "",
        token,
      );
      const selected = suggestedRecords.filter((r) => selectedIds.has(r.recordId));
      for (const record of selected) {
        await sendMessage(
          directive.doctorUserId,
          {
            recipientId: directive.doctorUserId,
            type: "medical_link",
            content: record.title,
            medicalLink: {
              record_type: record.recordType,
              record_id: record.recordId,
              title: record.title,
            },
          },
          token,
          profile.id,
          role ?? "patient",
        ).catch(() => undefined);
      }
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

  const selectedCount = suggestedRecords.filter((r) =>
    selectedIds.has(r.recordId),
  ).length;

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

      {suggestedRecords.length > 0 ? (
        <View style={styles.recordsBlock}>
          <Text
            style={[
              styles.sectionLabel,
              {
                color: colors.mutedForeground,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {isRTL
              ? "السجلات المقترحة للإرفاق — أكّد أو ألغِ الاختيار"
              : "Suggested records to attach — confirm or uncheck"}
          </Text>
          {suggestedRecords.map((record) => {
            const selected = selectedIds.has(record.recordId);
            return (
              <Pressable
                key={record.recordId}
                onPress={() => toggleRecord(record.recordId)}
                style={[
                  styles.recordRow,
                  {
                    flexDirection: dir,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected
                      ? `${colors.primary}12`
                      : colors.card,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {selected ? <Check size={12} color="#fff" /> : null}
                </View>
                <FileText
                  size={15}
                  color={selected ? colors.primary : colors.mutedForeground}
                />
                <View style={styles.recordTextWrap}>
                  <Text
                    style={[
                      styles.recordTitle,
                      {
                        color: colors.foreground,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {record.title}
                  </Text>
                  <Text
                    style={[
                      styles.recordType,
                      {
                        color: colors.mutedForeground,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  >
                    {record.recordType}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <Text
            style={[
              styles.attachHint,
              {
                color: colors.mutedForeground,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {isRTL
              ? `${selectedCount} سجل سيُرفق مع الاستشارة`
              : `${selectedCount} record${selectedCount === 1 ? "" : "s"} will be attached`}
          </Text>
        </View>
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
  recordsBlock: { marginBottom: 10, gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  recordRow: {
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  recordTextWrap: { flex: 1, gap: 2 },
  recordTitle: { fontSize: 13, fontWeight: "700" },
  recordType: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  attachHint: { fontSize: 12, fontWeight: "600" },
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
