import { MessageCircle } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { UI, primaryButton } from "@/constants/uiTokens";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { flexRow } from "@/utils/rtl";

type Props = {
  signedIn: boolean;
  onPress: () => void;
};

/** Shared start-consultation pill used in profile header (matches list card CTA). */
export function DoctorProfileConsultCta({ signedIn, onPress }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        signedIn ? t.home.startConsultation : "Sign in to start consultation"
      }
      style={({ pressed }) => [
        primaryButton(),
        styles.cta,
        {
          backgroundColor: colors.primary,
          opacity: pressed ? 0.92 : 1,
          flexDirection: dir,
        },
      ]}
    >
      <MessageCircle size={14} color="#fff" />
      <Text style={styles.ctaText} numberOfLines={1}>
        {signedIn
          ? t.home.startConsultation
          : isRTL
            ? "سجّل الدخول"
            : "Sign in to start"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cta: {
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 38,
    alignSelf: "stretch",
    ...UI.pressable,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    flexShrink: 1,
  },
});
