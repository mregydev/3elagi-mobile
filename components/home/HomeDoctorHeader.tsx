import { router } from "expo-router";
import {
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Radio,
  Video,
} from "lucide-react-native";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { surfaceCard, UI } from "@/constants/uiTokens";
import { useAuthStore } from "@/domains/auth/store";
import type { DoctorDashboardMetrics } from "@/hooks/useDoctorDashboard";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { alignText, flexRow } from "@/utils/rtl";

type QuickAction = {
  key: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  onPress?: () => void;
  primary?: boolean;
  badge?: string;
  toggle?: boolean;
};

function greetingKey(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

interface Props {
  metrics: DoctorDashboardMetrics;
  immediateCallEnabled: boolean;
  togglingAvailability?: boolean;
  onToggleAvailability: (next: boolean) => void;
}

export function HomeDoctorHeader({
  metrics,
  immediateCallEnabled,
  togglingAvailability = false,
  onToggleAvailability,
}: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isMobile, isDesktop } = useWebLayout();
  const stackActions = Platform.OS !== "web" || isMobile;
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const profile = useAuthStore((s) => s.profile);
  const displayName = profile?.name?.trim().split(/\s+/)[0] ?? "";
  const period = greetingKey();
  const greeting = displayName
    ? t.doctorDashboard.greetingNamed(period, displayName)
    : t.doctorDashboard.greeting(period);

  const queueBadge =
    metrics.openConsultations > 0
      ? t.doctorDashboard.startVideoQueueBadge(metrics.openConsultations)
      : undefined;

  const actions: QuickAction[] = [
    {
      key: "queue",
      label: t.doctorDashboard.startVideoQueue,
      hint: t.doctorDashboard.startVideoQueueHint,
      icon: <Video size={20} color={colors.primaryForeground} />,
      onPress: () => router.push("/(tabs)/consultations"),
      primary: true,
      badge: queueBadge,
    },
    {
      key: "schedule",
      label: t.doctorDashboard.viewSchedule,
      hint: t.doctorDashboard.viewScheduleHint,
      icon: <CalendarClock size={18} color={colors.primary} />,
      onPress: () => router.push("/(tabs)/appointments"),
    },
    {
      key: "records",
      label: t.doctorDashboard.patientRecords,
      hint: t.doctorDashboard.patientRecordsHint,
      icon: <ClipboardList size={18} color={colors.primary} />,
      onPress: () => router.push("/(tabs)/patients"),
    },
    {
      key: "availability",
      label: t.doctorDashboard.availability,
      hint: immediateCallEnabled
        ? t.doctorDashboard.availabilityOn
        : t.doctorDashboard.availabilityOff,
      icon: <Radio size={18} color={immediateCallEnabled ? colors.success : colors.mutedForeground} />,
      toggle: true,
    },
  ];

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.banner,
          surfaceCard(colors.card, colors.border),
          { backgroundColor: colors.accent },
        ]}
      >
        <Text style={[styles.greeting, { color: colors.foreground, textAlign }]}>
          {greeting}
        </Text>
        <Text style={[styles.bannerTag, { color: colors.accentForeground, textAlign }]}>
          {t.doctorDashboard.welcomeBanner}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign }]}>
          {t.doctorDashboard.subtitle}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: colors.card, flexDirection: dir }]}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: immediateCallEnabled ? colors.success : colors.mutedForeground },
            ]}
          />
          <Text style={[styles.statusText, { color: colors.foreground, textAlign }]}>
            {immediateCallEnabled ? t.doctorDashboard.availabilityOn : t.doctorDashboard.availabilityOff}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.foreground, textAlign }]}>
        {t.doctorDashboard.quickActions}
      </Text>

      <View
        style={[
          styles.actionsRow,
          stackActions
            ? styles.actionsStack
            : isDesktop
              ? styles.actionsGridDesktop
              : { flexDirection: dir },
        ]}
      >
        {actions.map((action) => {
          const cardStyle = [
            styles.actionCard,
            stackActions ? styles.actionCardStacked : styles.actionCardInline,
            action.primary
              ? { backgroundColor: colors.primary }
              : surfaceCard(colors.card, colors.border),
            { flexDirection: dir },
          ] as const;

          const inner = (
            <>
              <View
                style={[
                  styles.actionIcon,
                  {
                    backgroundColor: action.primary
                      ? "rgba(255,255,255,0.18)"
                      : `${colors.primary}14`,
                  },
                ]}
              >
                {action.icon}
              </View>
              <View style={styles.actionCopy}>
                {action.badge && action.primary ? (
                  <Text
                    style={[styles.actionBadge, { color: colors.primaryForeground, textAlign }]}
                    numberOfLines={1}
                  >
                    {action.badge}
                  </Text>
                ) : null}
                <Text
                  style={[
                    styles.actionLabel,
                    {
                      color: action.primary ? colors.primaryForeground : colors.foreground,
                      textAlign,
                    },
                  ]}
                  numberOfLines={stackActions ? 1 : compact ? 1 : 2}
                >
                  {action.label}
                </Text>
                {!action.primary && (stackActions || !compact) ? (
                  <Text
                    style={[styles.actionHint, { color: colors.mutedForeground, textAlign }]}
                    numberOfLines={1}
                  >
                    {action.hint}
                  </Text>
                ) : null}
              </View>
              {action.toggle ? (
                <Switch
                  value={immediateCallEnabled}
                  onValueChange={onToggleAvailability}
                  disabled={togglingAvailability}
                  trackColor={{ false: colors.border, true: `${colors.primary}88` }}
                  thumbColor={immediateCallEnabled ? colors.primary : colors.card}
                />
              ) : !action.primary ? (
                <ChevronRight
                  size={16}
                  color={colors.mutedForeground}
                  style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
                />
              ) : null}
            </>
          );

          if (action.toggle) {
            return (
              <View key={action.key} style={cardStyle}>
                {inner}
              </View>
            );
          }

          return (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${action.label}. ${action.hint}`}
              style={({ pressed }) => [
                ...cardStyle,
                { opacity: pressed ? 0.92 : 1 },
              ]}
            >
              {inner}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: UI.space.md,
    paddingTop: UI.space.sm,
    paddingBottom: UI.space.xs,
    gap: UI.space.md,
  },
  banner: {
    padding: UI.space.md,
    gap: 6,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.35,
    lineHeight: 30,
  },
  bannerTag: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 520,
    marginTop: 2,
  },
  statusPill: {
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: UI.radius.chip,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionLabel: {
    ...UI.type.section,
    fontSize: 15,
  },
  actionsRow: {
    gap: UI.space.sm,
  },
  actionsStack: {
    flexDirection: "column",
  },
  actionsGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actionCard: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: UI.radius.card,
  },
  actionCardStacked: {
    width: "100%",
  },
  actionCardInline: {
    flex: 1,
    minWidth: 140,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: UI.radius.icon,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  actionBadge: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
    opacity: 0.92,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  actionHint: {
    fontSize: 12,
    lineHeight: 16,
  },
});
