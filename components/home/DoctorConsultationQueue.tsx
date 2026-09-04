import { router } from "expo-router";
import { ClipboardList, MessageSquare } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { countryFlagEmoji } from "@/constants/patientCountries";
import { emptyStateSurface, primaryButton, secondaryButton, surfaceCard, UI } from "@/constants/uiTokens";
import type { DoctorConsultation } from "@/domains/consultations/api";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { formatEgp } from "@/utils/credits";
import { alignText, flexRow } from "@/utils/rtl";

interface Props {
  consultations: DoctorConsultation[];
}

export function DoctorConsultationQueue({ consultations }: Props) {
  const colors = useColors();
  const { t, isRTL, locale } = useI18n();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);

  const openChat = (patientId: string, consultationId?: string) => {
    router.push({
      pathname: "/chat/[id]",
      params: consultationId ? { id: patientId, consultationId } : { id: patientId },
    });
  };

  const openRecords = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  return (
    <View style={[styles.wrap, surfaceCard(colors.card, colors.border), { marginHorizontal: 16 }]}>
      <View style={[styles.titleRow, { flexDirection: dir }]}>
        <Text style={[styles.title, { color: colors.foreground, textAlign }]}>
          {t.doctorDashboard.consultationQueue}
        </Text>
        {consultations.length > 0 ? (
          <View style={[styles.countBadge, { backgroundColor: `${colors.primary}18` }]}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
              {consultations.length > 99 ? "99+" : consultations.length}
            </Text>
          </View>
        ) : null}
      </View>

      {consultations.length === 0 ? (
        <View style={emptyStateSurface(colors.muted, colors.border)}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, textAlign }]}>
            {t.doctorDashboard.consultationQueueEmpty}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {consultations.map((item) => {
            const date = new Date(item.created_at).toLocaleDateString(
              locale === "ar" ? "ar-EG" : "en-US",
            );

            return (
              <View
                key={item.id}
                style={[styles.card, surfaceCard(colors.card, colors.border), { backgroundColor: colors.muted }]}
              >
                <View style={{ gap: 4 }}>
                  <View style={[styles.cardTop, { flexDirection: dir }]}>
                    <Text style={[styles.cardName, { color: colors.foreground, textAlign, flex: 1 }]}>
                      {/* Country the consultation was requested from. */}
                      {item.patient_country
                        ? `${countryFlagEmoji(item.patient_country)} `
                        : ""}
                      {item.patient_name}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${colors.primary}18` }]}>
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "700" }}>
                        {t.doctorDashboard.active}
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
                    <MessageSquare size={15} color={colors.primaryForeground} />
                    <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                      {t.doctorDashboard.openChat}
                    </Text>
                  </Pressable>
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
  titleRow: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    ...UI.type.section,
    fontSize: 16,
    flex: 1,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
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
});
