import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Bot, PenLine } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/domains/auth/store";
import {
  buildMedicalAddAiHref,
  buildMedicalAddHref,
} from "@/domains/medical/addHref";
import { parseBodyPart } from "@/domains/medical/bodyParts";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { alignText, flexRow } from "@/utils/rtl";

export function MedicalAddMethodChoice() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const role = useAuthStore((s) => s.role);
  const isPatient = role?.toLowerCase() === "patient";
  const {
    patientUserId,
    bodyPart: bodyPartParam,
    requestId: requestIdParam,
    category: categoryParam,
  } = useLocalSearchParams<{
    patientUserId?: string;
    bodyPart?: string;
    requestId?: string;
    category?: string;
  }>();
  const bodyPart = parseBodyPart(bodyPartParam);
  const category =
    categoryParam === "lab" || categoryParam === "xray" || categoryParam === "prescription"
      ? categoryParam
      : undefined;
  const opts = {
    patientUserId: patientUserId?.trim() || undefined,
    bodyPart: bodyPart ?? undefined,
    requestId: requestIdParam?.trim() || undefined,
    category,
  };

  // Doctors skip method choice — go straight to the manual form.
  if (!isPatient) {
    return <Redirect href={buildMedicalAddHref(null, opts) as never} />;
  }

  const goManual = () => {
    router.replace(buildMedicalAddHref(category ?? null, opts) as never);
  };

  const goAi = () => {
    router.replace(buildMedicalAddAiHref(opts) as never);
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.foreground, textAlign }]}>
        {t.records.addMethodTitle}
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign }]}>
        {t.records.addMethodSubtitle}
      </Text>

      <View style={styles.options}>
        <Pressable
          onPress={goManual}
          style={({ pressed }) => [
            styles.card,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
              opacity: pressed ? 0.92 : 1,
              flexDirection: dir,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t.records.addManually}
        >
          <View style={[styles.iconBubble, { backgroundColor: `${colors.primary}14` }]}>
            <PenLine size={22} color={colors.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.foreground, textAlign }]}>
              {t.records.addManually}
            </Text>
            <Text style={[styles.cardHint, { color: colors.mutedForeground, textAlign }]}>
              {t.records.addManuallyHint}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={goAi}
          style={({ pressed }) => [
            styles.card,
            {
              borderColor: colors.primary,
              backgroundColor: `${colors.primary}08`,
              opacity: pressed ? 0.92 : 1,
              flexDirection: dir,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t.records.addWithAi}
        >
          <View style={[styles.iconBubble, { backgroundColor: `${colors.primary}22` }]}>
            <Bot size={22} color={colors.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.foreground, textAlign }]}>
              {t.records.addWithAi}
            </Text>
            <Text style={[styles.cardHint, { color: colors.mutedForeground, textAlign }]}>
              {t.records.addWithAiHint}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  options: {
    marginTop: 28,
    gap: 12,
  },
  card: {
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardHint: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
});
