import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { DoctorFees } from "@/domains/doctor/fees";
import { formatDoctorFee } from "@/domains/doctor/fees";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useViewerCountry } from "@/hooks/useViewerCountry";

type Props = {
  doctor: DoctorFees;
  isRTL: boolean;
  /** Shown when the doctor has set neither price (legacy credit pricing). */
  fallback?: string;
  compact?: boolean;
};

/**
 * The doctor's chat and video prices as they apply to whoever is looking:
 * local currency for patients in the doctor's country, USD for everyone else.
 * The viewer's country comes from their IP, not their profile.
 */
export function DoctorFeeLines({ doctor, isRTL, fallback, compact }: Props) {
  const colors = useColors();
  const { t } = useI18n();
  const viewerCountry = useViewerCountry();
  const textAlign = isRTL ? "left" : "right";

  const text = formatDoctorFee(doctor, viewerCountry, "text");
  const video = formatDoctorFee(doctor, viewerCountry, "video");

  if (!text && !video) {
    return fallback ? (
      <Text style={[styles.value, { color: colors.primary, textAlign }]}>{fallback}</Text>
    ) : null;
  }

  return (
    <View style={[styles.wrap, { alignItems: isRTL ? "flex-start" : "flex-end" }]}>
      {text ? (
        <Text style={[styles.line, compact && styles.lineCompact, { textAlign }]}>
          <Text style={{ color: colors.mutedForeground }}>{t.home.textConsultationShort} </Text>
          <Text style={{ color: colors.primary, fontWeight: "800" }}>{text}</Text>
        </Text>
      ) : null}
      {video ? (
        <Text style={[styles.line, compact && styles.lineCompact, { textAlign }]}>
          <Text style={{ color: colors.mutedForeground }}>{t.home.videoConsultationShort} </Text>
          <Text style={{ color: colors.primary, fontWeight: "800" }}>{video}</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  value: { fontSize: 13, fontWeight: "800" },
  line: { fontSize: 12.5 },
  lineCompact: { fontSize: 11.5 },
});
