import { router } from "expo-router";
import { CalendarClock, Coins, MessageSquare, Users } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { surfaceCard, UI } from "@/constants/uiTokens";
import type { DoctorDashboardMetrics } from "@/hooks/useDoctorDashboard";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { formatEgp } from "@/utils/credits";
import { alignText, flexRow } from "@/utils/rtl";

interface Props {
  metrics: DoctorDashboardMetrics;
}

export function HomeDoctorSummary({ metrics }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);

  const stats = [
    {
      key: "appointments",
      label: t.doctorDashboard.appointmentsToday,
      value: String(metrics.appointmentsToday),
      icon: CalendarClock,
      onPress: () => router.push("/(tabs)/appointments"),
    },
    {
      key: "pending",
      label: t.doctorDashboard.pendingConsultations,
      value: String(metrics.pendingConsultations),
      icon: Users,
      onPress: () => router.push("/(tabs)/consultations"),
    },
    {
      key: "messages",
      label: t.doctorDashboard.unreadMessages,
      value: String(metrics.unreadMessages),
      icon: MessageSquare,
      onPress: () => router.push("/(tabs)/history"),
    },
    {
      key: "credits",
      label: t.doctorDashboard.reimbursableCredits,
      value: formatEgp(metrics.reimbursableCredits, t),
      icon: Coins,
      onPress: () => router.push("/(tabs)/consultations"),
    },
  ];

  return (
    <View style={[styles.wrap, surfaceCard(colors.card, colors.border), { marginHorizontal: 16 }]}>
      <Text style={[styles.title, { color: colors.foreground, textAlign }]}>
        {t.doctorDashboard.metricsSummary}
      </Text>
      <View style={[styles.grid, isDesktop ? { flexDirection: dir } : styles.gridStack]}>
        {stats.map((stat) => (
          <Pressable
            key={stat.key}
            onPress={stat.onPress}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.stat,
              {
                backgroundColor: colors.muted,
                opacity: pressed ? 0.9 : 1,
                flex: isDesktop ? 1 : undefined,
              },
            ]}
          >
            <View style={[styles.statHead, { flexDirection: dir }]}>
              <stat.icon size={16} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.mutedForeground, textAlign }]}>
                {stat.label}
              </Text>
            </View>
            <Text style={[styles.statValue, { color: colors.foreground, textAlign }]} numberOfLines={1}>
              {stat.value}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: UI.space.md,
    gap: UI.space.sm,
    marginBottom: UI.space.sm,
  },
  title: {
    ...UI.type.section,
    fontSize: 16,
  },
  grid: {
    gap: UI.space.sm,
  },
  gridStack: {
    flexDirection: "column",
  },
  stat: {
    borderRadius: UI.radius.inner,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
    minWidth: 0,
  },
  statHead: {
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    ...UI.type.meta,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});
