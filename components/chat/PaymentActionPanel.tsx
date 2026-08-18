import { ExternalLink, Receipt } from "lucide-react-native";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { PaymentActionMeta } from "@/domains/chat/types";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

export type PaymentReply = "submit" | "approve" | "reject";

type Props = {
  meta: PaymentActionMeta;
  isDoctor: boolean;
  busy?: boolean;
  /** When true, hide pay / attach / approve controls (e.g. cancelled appointment). */
  inactive?: boolean;
  onReply?: (reply: PaymentReply) => void;
};

/**
 * The money half of an appointment / consultation card: what is owed, where to
 * pay it, and the receipt the doctor has to approve before anything opens.
 */
export function PaymentActionPanel({ meta, isDoctor, busy, inactive, onReply }: Props) {
  const colors = useColors();
  const { isRTL } = useI18n();
  const status = meta.payment_status ?? "none";
  if (status === "none") return null;

  const dir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const amount =
    typeof meta.payment_amount === "number" && meta.payment_amount > 0
      ? `${meta.payment_amount} ${meta.payment_currency ?? ""}`.trim()
      : null;

  const headline =
    inactive
      ? isRTL
        ? "تم إلغاء الموعد"
        : "This appointment was cancelled"
      : status === "paid"
      ? isRTL
        ? "تم تأكيد الدفع"
        : "Payment confirmed"
      : status === "proof_submitted"
        ? isDoctor
          ? isRTL
            ? "المريض أرسل إيصال الدفع"
            : "The patient sent a payment receipt"
          : isRTL
            ? "بانتظار تأكيد الطبيب للدفع"
            : "Waiting for the doctor to confirm your payment"
        : isDoctor
          ? isRTL
            ? "بانتظار دفع المريض"
            : "Waiting for the patient to pay"
          : isRTL
            ? "مطلوب الدفع قبل التأكيد"
            : "Payment required before this is confirmed";

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <Text style={[styles.headline, { color: colors.foreground, textAlign }]}>
        {headline}
      </Text>
      {amount ? (
        <Text style={[styles.amount, { color: colors.primary, textAlign }]}>{amount}</Text>
      ) : null}

      {/* The doctor's own payment URL, shown in full so the patient can read,
          copy or open it — not hidden behind a button. */}
      {!inactive && status === "awaiting_payment" && meta.payment_link ? (
        <Pressable
          onPress={() =>
            void Linking.openURL(meta.payment_link!).catch(() => undefined)
          }
          accessibilityRole="link"
          accessibilityLabel={meta.payment_link}
        >
          <Text
            style={[styles.link, { color: colors.primary, textAlign }]}
            numberOfLines={2}
          >
            {meta.payment_link}
          </Text>
        </Pressable>
      ) : null}
      {!inactive && status === "awaiting_payment" && !meta.payment_link ? (
        <Text style={[styles.hint, { color: colors.mutedForeground, textAlign }]}>
          {isDoctor
            ? isRTL
              ? "أضف رابط الدفع في ملفك ليتمكن المريض من الدفع."
              : "Add a payment link to your profile so the patient can pay."
            : isRTL
              ? "لم يضف الطبيب رابط دفع بعد — اسأله عن طريقة الدفع."
              : "The doctor has not added a payment link yet — ask them how to pay."}
        </Text>
      ) : null}

      <View style={[styles.actions, { flexDirection: dir }]}>
        {!inactive && !isDoctor && status === "awaiting_payment" && meta.payment_link ? (
          <LinkButton
            label={isRTL ? "ادفع الآن" : "Pay now"}
            url={meta.payment_link}
            color={colors.primary}
          />
        ) : null}
        {!inactive && !isDoctor && status === "awaiting_payment" ? (
          <ActionButton
            label={isRTL ? "إرفاق الإيصال" : "Attach receipt"}
            filled
            color={colors.primary}
            busy={busy}
            onPress={() => onReply?.("submit")}
          />
        ) : null}
        {meta.payment_proof_url ? (
          <LinkButton
            label={isRTL ? "عرض الإيصال" : "View receipt"}
            url={meta.payment_proof_url}
            color={colors.primary}
            icon="receipt"
          />
        ) : null}
        {!inactive && isDoctor && status === "proof_submitted" ? (
          <>
            <ActionButton
              label={isRTL ? "اعتماد" : "Approve"}
              filled
              color="#10b981"
              busy={busy}
              onPress={() => onReply?.("approve")}
            />
            <ActionButton
              label={isRTL ? "رفض" : "Reject"}
              color="#dc2626"
              busy={busy}
              onPress={() => onReply?.("reject")}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}

function LinkButton({
  label,
  url,
  color,
  icon,
}: {
  label: string;
  url: string;
  color: string;
  icon?: "receipt";
}) {
  const Icon = icon === "receipt" ? Receipt : ExternalLink;
  return (
    <Pressable
      onPress={() => void Linking.openURL(url).catch(() => undefined)}
      style={({ pressed }) => [
        styles.btn,
        styles.btnOutline,
        { borderColor: color, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Icon size={14} color={color} />
      <Text style={[styles.btnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function ActionButton({
  label,
  color,
  filled,
  busy,
  onPress,
}: {
  label: string;
  color: string;
  filled?: boolean;
  busy?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        filled ? { backgroundColor: color } : [styles.btnOutline, { borderColor: color }],
        { opacity: busy ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.btnText, { color: filled ? "#fff" : color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  headline: { fontSize: 13, fontWeight: "700" },
  link: {
    fontSize: 12.5,
    fontWeight: "600",
    textDecorationLine: "underline",
    lineHeight: 17,
  },
  hint: { fontSize: 12, lineHeight: 16 },
  amount: { fontSize: 15, fontWeight: "800" },
  actions: { gap: 8, flexWrap: "wrap", marginTop: 2 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnOutline: { borderWidth: 1 },
  btnText: { fontSize: 13, fontWeight: "700" },
});
