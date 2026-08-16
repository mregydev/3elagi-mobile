import { router } from "expo-router";
import {
  Check,
  ClipboardList,
  History,
  MessageSquare,
  Video,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { acceptConsultation, type DoctorConsultation } from "@/domains/consultations/api";
import { emptyStateSurface, primaryButton, secondaryButton, surfaceCard, UI } from "@/constants/uiTokens";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { formatEgp } from "@/utils/credits";
import { alignText, flexRow } from "@/utils/rtl";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

type QueueTab = "pending" | "active" | "messages";

interface Props {
  consultations: DoctorConsultation[];
  unreadMessages: number;
  onChanged?: () => void;
}

function queueItems(consultations: DoctorConsultation[], tab: QueueTab): DoctorConsultation[] {
  if (tab === "pending") {
    return consultations.filter((c) => c.status === "pending");
  }
  if (tab === "active") {
    return consultations.filter((c) => c.status === "open");
  }
  return consultations.filter((c) => c.status === "open" || c.status === "pending");
}

export function DoctorConsultationQueue({ consultations, unreadMessages, onChanged }: Props) {
  const colors = useColors();
  const { t, isRTL, locale } = useI18n();
  const accessToken = useAuthStore((s) => s.accessToken);
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const [tab, setTab] = useState<QueueTab>("pending");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => consultations.filter((c) => c.status === "pending").length,
    [consultations],
  );
  const activeCount = useMemo(
    () => consultations.filter((c) => c.status === "open").length,
    [consultations],
  );

  const items = useMemo(() => queueItems(consultations, tab), [consultations, tab]);

  const tabs: { key: QueueTab; label: string; count: number }[] = [
    { key: "pending", label: t.doctorDashboard.tabPending, count: pendingCount },
    { key: "active", label: t.doctorDashboard.tabActive, count: activeCount },
    { key: "messages", label: t.doctorDashboard.tabMessages, count: unreadMessages },
  ];

  const openChat = (patientId: string, consultationId?: string) => {
    router.push({
      pathname: "/chat/[id]",
      params: consultationId ? { id: patientId, consultationId } : { id: patientId },
    });
  };

  const openRecords = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  const handleAccept = async (item: DoctorConsultation) => {
    if (!accessToken) return;
    setAcceptingId(item.id);
    try {
      await acceptConsultation(item.id, accessToken);
      showSuccessToast(t.doctorDashboard.acceptedToast);
      onChanged?.();
      openChat(item.patient_id, item.id);
    } catch (e) {
      showErrorToast(t.common.error, (e as Error).message);
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <View style={[styles.wrap, surfaceCard(colors.card, colors.border), { marginHorizontal: 16 }]}>
      <Text style={[styles.title, { color: colors.foreground, textAlign }]}>
        {t.doctorDashboard.consultationQueue}
      </Text>

      <View style={[styles.tabs, { flexDirection: dir }]}>
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={({ pressed }) => [
                styles.tab,
                {
                  backgroundColor: active ? colors.primary : colors.muted,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? colors.primaryForeground : colors.foreground, textAlign },
                ]}
              >
                {item.label}
              </Text>
              {item.count > 0 ? (
                <View
                  style={[
                    styles.tabBadge,
                    { backgroundColor: active ? "rgba(255,255,255,0.22)" : `${colors.primary}18` },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.primaryForeground : colors.primary,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {item.count > 99 ? "99+" : item.count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {tab === "messages" ? (
        <View style={styles.messagesPanel}>
          <View style={[styles.messageCard, { backgroundColor: colors.muted, flexDirection: dir }]}>
            <History size={18} color={colors.primary} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.cardName, { color: colors.foreground, textAlign }]}>
                {t.doctorDashboard.unreadMessages}
              </Text>
              <Text style={[styles.cardMeta, { color: colors.mutedForeground, textAlign }]}>
                {unreadMessages > 0
                  ? t.doctorDashboard.unreadMessagesHint(unreadMessages)
                  : t.doctorDashboard.messagesCaughtUp}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/history")}
              style={({ pressed }) => [
                styles.linkBtn,
                secondaryButton(colors.border, colors.card),
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <MessageSquare size={15} color={colors.primary} />
              <Text style={[styles.linkBtnText, { color: colors.primary }]}>
                {t.doctorDashboard.openChatHistory}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : items.length === 0 ? (
        <View style={emptyStateSurface(colors.muted, colors.border)}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, textAlign }]}>
            {t.doctorDashboard.consultationQueueEmpty}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const date = new Date(item.created_at).toLocaleDateString(
              locale === "ar" ? "ar-EG" : "en-US",
            );
            const isPending = item.status === "pending";
            const busy = acceptingId === item.id;

            return (
              <View
                key={item.id}
                style={[styles.card, surfaceCard(colors.card, colors.border), { backgroundColor: colors.muted }]}
              >
                <View style={{ gap: 4 }}>
                  <View style={[styles.cardTop, { flexDirection: dir }]}>
                    <Text style={[styles.cardName, { color: colors.foreground, textAlign, flex: 1 }]}>
                      {item.patient_name}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isPending ? `${colors.warning}22` : `${colors.primary}18`,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: isPending ? colors.warning : colors.primary,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {isPending ? t.doctorDashboard.pending : t.doctorDashboard.active}
                      </Text>
                    </View>
                  </View>
                  {item.description ? (
                    <Text
                      style={[styles.cardDesc, { color: colors.mutedForeground, textAlign }]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  ) : null}
                  <Text style={[styles.cardMeta, { color: colors.mutedForeground, textAlign }]}>
                    {date} · {formatEgp(item.reserved_points, t)}
                  </Text>
                </View>

                <View style={[styles.actions, { flexDirection: dir }]}>
                  {isPending ? (
                    <Pressable
                      onPress={() => void handleAccept(item)}
                      disabled={busy}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        primaryButton(),
                        {
                          backgroundColor: colors.primary,
                          opacity: pressed || busy ? 0.88 : 1,
                          flexDirection: dir,
                        },
                      ]}
                    >
                      {busy ? (
                        <ActivityIndicator color={colors.primaryForeground} size="small" />
                      ) : (
                        <>
                          <Check size={15} color={colors.primaryForeground} />
                          <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                            {t.doctorDashboard.accept}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => openChat(item.patient_id, item.id)}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        primaryButton(),
                        {
                          backgroundColor: colors.primary,
                          opacity: pressed ? 0.88 : 1,
                          flexDirection: dir,
                        },
                      ]}
                    >
                      <Video size={15} color={colors.primaryForeground} />
                      <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                        {t.doctorDashboard.startVideo}
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => openRecords(item.patient_id)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      secondaryButton(colors.border, colors.card),
                      { opacity: pressed ? 0.9 : 1, flexDirection: dir },
                    ]}
                  >
                    <ClipboardList size={15} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                      {t.doctorDashboard.viewRecords}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openChat(item.patient_id, item.id)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      secondaryButton(colors.border, colors.card),
                      { opacity: pressed ? 0.9 : 1, flexDirection: dir },
                    ]}
                  >
                    <MessageSquare size={15} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                      {t.doctorDashboard.openChat}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: UI.space.md,
    gap: UI.space.md,
    marginBottom: UI.space.lg,
  },
  title: {
    ...UI.type.section,
    fontSize: 16,
  },
  tabs: {
    flexWrap: "wrap",
    gap: UI.space.sm,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: UI.radius.chip,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    gap: UI.space.sm,
  },
  card: {
    padding: 14,
    gap: 12,
  },
  cardTop: {
    alignItems: "center",
    gap: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: UI.radius.chip,
  },
  actions: {
    flexWrap: "wrap",
    gap: UI.space.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 38,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messagesPanel: {
    gap: UI.space.sm,
  },
  messageCard: {
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: UI.radius.inner,
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 38,
  },
  linkBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
