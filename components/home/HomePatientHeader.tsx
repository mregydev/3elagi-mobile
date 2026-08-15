import { router } from "expo-router";
import { Bot, CalendarDays, ChevronRight, Stethoscope } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { cardShell, UI } from "@/constants/uiTokens";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { alignText, flexRow } from "@/utils/rtl";

type QuickAction = {
  key: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  onPress: () => void;
  accent: string;
  borderAccent: string;
};

function greetingKey(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

interface Props {
  aiEnabled?: boolean;
  signedIn?: boolean;
  onFindDoctor?: () => void;
}

export function HomePatientHeader({
  aiEnabled = true,
  signedIn = true,
  onFindDoctor,
}: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const profile = useAuthStore((s) => s.profile);
  const firstName = profile?.name?.trim().split(/\s+/)[0] ?? "";
  const period = greetingKey();
  const greeting = firstName
    ? t.home.greetingNamed(period, firstName)
    : t.home.greeting(period);

  const actions: QuickAction[] = [
    {
      key: "find",
      label: t.home.findDoctor,
      hint: t.home.findDoctorHint,
      icon: <Stethoscope size={18} color={colors.primary} />,
      onPress: () => onFindDoctor?.(),
      accent: `${colors.primary}12`,
      borderAccent: `${colors.primary}30`,
    },
    ...(aiEnabled && signedIn
      ? [
          {
            key: "ai",
            label: t.home.aiAssistant,
            hint: t.home.aiAssistantHint,
            icon: <Bot size={18} color={colors.info} />,
            onPress: () => router.push("/(tabs)/assistant"),
            accent: `${colors.info}12`,
            borderAccent: `${colors.info}35`,
          } satisfies QuickAction,
        ]
      : []),
    ...(signedIn
      ? [
          {
            key: "consultations",
            label: t.home.myConsultations,
            hint: t.home.myConsultationsHint,
            icon: <CalendarDays size={18} color="#6d28d9" />,
            onPress: () => router.push("/(tabs)/consultations"),
            accent: "#6d28d912",
            borderAccent: "#6d28d935",
          } satisfies QuickAction,
        ]
      : []),
  ];

  return (
    <View style={styles.wrap}>
      <View style={[styles.greetingBlock, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
        <Text style={[styles.greeting, { color: colors.foreground, textAlign }]}>
          {greeting}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign }]}>
          {t.home.subtitle}
        </Text>
      </View>

      <View style={[styles.actionsRow, { flexDirection: dir }]}>
        {actions.map((action) => (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${action.label}. ${action.hint}`}
            style={({ pressed }) => [
              styles.actionCard,
              cardShell(action.borderAccent, colors.card),
              {
                borderColor: action.borderAccent,
                opacity: pressed ? 0.92 : 1,
                flexDirection: dir,
              },
            ]}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.accent }]}>
              {action.icon}
            </View>
            <View style={styles.actionCopy}>
              <Text
                style={[styles.actionLabel, { color: colors.foreground, textAlign }]}
                numberOfLines={compact ? 1 : 2}
              >
                {action.label}
              </Text>
              {!compact ? (
                <Text
                  style={[styles.actionHint, { color: colors.mutedForeground, textAlign }]}
                  numberOfLines={1}
                >
                  {action.hint}
                </Text>
              ) : null}
            </View>
            <ChevronRight
              size={16}
              color={colors.mutedForeground}
              style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
    gap: 10,
  },
  greetingBlock: {
    gap: 3,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 420,
  },
  actionsRow: {
    gap: 8,
  },
  actionCard: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: UI.radius.icon,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
  },
  actionHint: {
    fontSize: 10,
    lineHeight: 13,
  },
});
