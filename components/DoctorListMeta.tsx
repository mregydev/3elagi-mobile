import { Star } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface SubtitleProps {
  specialty?: string;
  isRTL: boolean;
}

export function DoctorSubtitle({ specialty, isRTL }: SubtitleProps) {
  const colors = useColors();
  if (!specialty) return null;

  return (
    <Text
      style={[
        styles.subtitle,
        { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
      ]}
      numberOfLines={1}
    >
      {specialty}
    </Text>
  );
}

interface TrailingProps {
  isRTL: boolean;
  rating?: number;
  ratingTotal?: number;
  messagePrice?: number;
  showReviewCount?: boolean;
}

export function DoctorTrailingMeta({
  isRTL,
  rating,
  ratingTotal,
  messagePrice,
  showReviewCount = false,
}: TrailingProps) {
  const colors = useColors();
  const hasRating = rating != null && rating > 0;
  const price = messagePrice ?? 1;
  const align = isRTL ? "flex-start" : "flex-end";

  return (
    <View style={[styles.trailing, { alignItems: align }]}>
      <View style={[styles.ratingLine, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Star size={11} color={colors.warning} fill={hasRating ? colors.warning : "transparent"} />
        <Text style={[styles.ratingValue, { color: colors.foreground }]}>
          {hasRating ? rating!.toFixed(1) : isRTL ? "جديد" : "New"}
        </Text>
      </View>

      {showReviewCount && hasRating && ratingTotal != null && ratingTotal > 0 ? (
        <Text style={[styles.reviewCount, { color: colors.mutedForeground, textAlign: isRTL ? "left" : "right" }]}>
          {ratingTotal} {isRTL ? "تقييم" : "reviews"}
        </Text>
      ) : null}

      <Text style={[styles.priceLine, { textAlign: isRTL ? "left" : "right" }]}>
        <Text style={[styles.priceValue, { color: colors.primary }]}>{price}</Text>
        <Text style={[styles.priceUnit, { color: colors.mutedForeground }]}>
          {" "}
          {isRTL ? "نقطة/رسالة" : "pts/msg"}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },
  trailing: {
    gap: 2,
    minWidth: 52,
  },
  ratingLine: {
    alignItems: "center",
    gap: 3,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  reviewCount: {
    fontSize: 11,
    lineHeight: 14,
  },
  priceLine: {
    marginTop: 2,
    lineHeight: 16,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: "500",
  },
});
