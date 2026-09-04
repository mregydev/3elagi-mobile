import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppTextInput } from "@/components/AppTextInput";
import { patientCountryLabel } from "@/constants/patientCountries";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

/** Home currency of the doctor's market; everyone abroad pays USD. */
export function localFeeCurrency(country?: string | null): "EGP" | "JOD" | "USD" {
  const code = country?.trim().toUpperCase();
  if (code === "EG") return "EGP";
  if (code === "JO") return "JOD";
  return "USD";
}

type Props = {
  /** The doctor's own country — decides the local currency and the labels. */
  country?: string | null;
  textLocal: string;
  onTextLocal: (v: string) => void;
  textUsd: string;
  onTextUsd: (v: string) => void;
  videoLocal: string;
  onVideoLocal: (v: string) => void;
  videoUsd: string;
  onVideoUsd: (v: string) => void;
  paymentLink: string;
  onPaymentLink: (v: string) => void;
  disabled?: boolean;
};

/**
 * The four cash prices a doctor charges — text and video, at home and abroad —
 * plus the link patients pay through. Money never moves inside the app.
 */
export function DoctorFeesFields({
  country,
  textLocal,
  onTextLocal,
  textUsd,
  onTextUsd,
  videoLocal,
  onVideoLocal,
  videoUsd,
  onVideoUsd,
  paymentLink,
  onPaymentLink,
  disabled,
}: Props) {
  const colors = useColors();
  const { isRTL } = useI18n();
  const home = patientCountryLabel(country, isRTL);
  const currency = localFeeCurrency(country);
  const inside = isRTL ? `داخل ${home} (${currency})` : `Inside ${home} (${currency})`;
  const outside = isRTL ? `خارج ${home} (دولار)` : `Outside ${home} (USD)`;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.groupLabel, { color: colors.foreground }]}>
        {isRTL ? "استشارة نصية" : "Text consultation"}
      </Text>
      <FeeInput
        testID="profile-local-price"
        label={inside}
        value={textLocal}
        onChangeText={onTextLocal}
        disabled={disabled}
      />
      <FeeInput
        testID="profile-outside-price"
        label={outside}
        value={textUsd}
        onChangeText={onTextUsd}
        disabled={disabled}
      />

      <Text style={[styles.groupLabel, { color: colors.foreground }]}>
        {isRTL ? "استشارة فيديو" : "Video consultation"}
      </Text>
      <FeeInput
        label={inside}
        value={videoLocal}
        onChangeText={onVideoLocal}
        disabled={disabled}
      />
      <FeeInput
        label={outside}
        value={videoUsd}
        onChangeText={onVideoUsd}
        disabled={disabled}
      />

      <FeeInput
        label={isRTL ? "رابط الدفع" : "Payment link"}
        value={paymentLink}
        onChangeText={onPaymentLink}
        placeholder="https://…"
        keyboardType="default"
        disabled={disabled}
      />
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
        {isRTL
          ? "يدفع المريض عبر هذا الرابط ويرفق إيصال الدفع، ثم تعتمده أنت."
          : "Patients pay through this link, attach the receipt, and you approve it."}
      </Text>
    </View>
  );
}

function FeeInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "decimal-pad",
  disabled,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "decimal-pad" | "default";
  disabled?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  const { isRTL } = useI18n();
  const textAlign = isRTL ? "right" : "left";

  return (
    <View style={styles.field} testID={testID}>
      <Text style={[styles.label, { color: colors.mutedForeground, textAlign }]}>
        {label}
      </Text>
      <AppTextInput
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={[
          styles.input,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.background,
            textAlign,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  groupLabel: { fontSize: 14, fontWeight: "800" },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 46,
  },
  hint: { fontSize: 12, lineHeight: 17 },
});
