import { router } from "expo-router";
import { ClipboardList, Inbox, MessageSquare } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { countryFlagEmoji } from "@/constants/patientCountries";
import {
  DASHBOARD_INDIGO,
  DASHBOARD_INDIGO_LIGHT,
} from "@/constants/dashboardTheme";
import { primaryButton, secondaryButton, surfaceCard, UI } from "@/constants/uiTokens";
import type { DoctorConsultation } from "@/domains/consultations/api";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { formatEgp } from "@/utils/credits";
import { alignText, flexRow } from "@/utils/rtl";

interface Props {
  consultations: DoctorConsultation[];
}

export function DoctorConsultationQueue({ consultations }: Props) {
  const colors = useColors();
  const { t, isRTL, locale } = useI18n();
  const { isDesktop } = useWebLayout();
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
    <View
      style={[
        styles.wrap,
        surfaceCard(colors.card, colors.border),
        { marginHorizontal: 16 },
        Platform.select({
          web: { boxShadow: "0 1px 3px rgba(79,70,229,0.06), inset 0 0 0 1px rgba(79,70,229,0.08)" },
          default: {},
        }),
      ]}
    >
      <View style={[styles.titleRow, { flexDirection: dir }]}>
        <Text style={[styles.title, { color: colors.foreground, textAlign }]}>
          {t.doctorDashboard.consultationQueue}
        </Text>
        {consultations.length > 0 ? (
          <View style={[styles.countBadge, { backgroundColor: `${DASHBOARD_INDIGO}18` }]}>
            <Text style={{ color: DASHBOARD_INDIGO, fontSize: 11, fontWeight: "700" }}>
              {consultations.length > 99 ? "99+" : consultations.length}
            </Text>
          </View>
        ) : null}
      </View>

      {consultations.length === 0 ? (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: DASHBOARD_INDIGO_LIGHT,
              borderColor: `${DASHBOARD_INDIGO}30`,
            },
          ]}
        >
          <View style={[styles.emptyIconWrap, { backgroundColor: `${DASHBOARD_INDIGO}14` }]}>
            <Inbox size={22} color={DASHBOARD_INDIGO} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground, textAlign }]}>
            {t.doctorDashboard.consultationQueue}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, textAlign }]}>
            {t.doctorDashboard.consultationQueueEmpty}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {isDesktop ? (
            <View
              style={[
                styles.tableHeader,
                { flexDirection: dir, backgroundColor: `${DASHBOARD_INDIGO}08` },
              ]}
            >
              <Text style={[styles.tableHeaderCell, styles.colPatient, { color: colors.mutedForeground, textAlign }]}>
                Patient
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colStatus, { color: colors.mutedForeground, textAlign }]}>
                Status
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colDate, { color: colors.mutedForeground, textAlign }]}>
                Requested
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colActions, { color: colors.mutedForeground, textAlign }]}>
                Actions
              </Text>
            </View>
          ) : null}

          {consultations.map((item) => {
            const date = new Date(item.created_at).toLocaleDateString(
              locale === "ar" ? "ar-EG" : "en-US",
            );

            if (isDesktop) {
              return (
                <View
                  key={item.id}
                  style={[
                    styles.tableRow,
                    { flexDirection: dir, borderBottomColor: `${colors.border}80` },
                  ]}
                >
                  <View style={[styles.colPatient, styles.cellPatient]}>
                    <Text style={[styles.rowName, { color: colors.foreground, textAlign }]} numberOfLines={1}>
                      {item.patient_country ? `${countryFlagEmoji(item.patient_country)} ` : ""}
                      {item.patient_name}
                    </Text>
                    {item.description ? (
                      <Text
                        style={[styles.rowDesc, { color: colors.mutedForeground, textAlign }]}
                        numberOfLines={1}
                      >
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.colStatus}>
                    <View style={[styles.statusBadge, { backgroundColor: `${DASHBOARD_INDIGO}14` }]}>
                      <Text style={{ color: DASHBOARD_INDIGO, fontSize: 10, fontWeight: "700" }}>
                        {t.doctorDashboard.active}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.colDate, styles.rowMeta, { color: colors.mutedForeground, textAlign }]}>
                    {date} · {formatEgp(item.reserved_points, t)}
                  </Text>
                  <View style={[styles.colActions, styles.rowActions, { flexDirection: dir }]}>
                    <Pressable
                      onPress={() => openChat(item.patient_id, item.id)}
                      style={({ pressed }) => [
                        styles.tableBtn,
                        primaryButton(),
                        { backgroundColor: DASHBOARD_INDIGO, opacity: pressed ? 0.88 : 1, flexDirection: dir },
                      ]}
                    >
                      <MessageSquare size={13} color="#fff" />
                      <Text style={[styles.tableBtnText, { color: "#fff" }]}>
                        {t.doctorDashboard.openChat}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => openRecords(item.patient_id)}
                      style={({ pressed }) => [
                        styles.tableBtn,
                        secondaryButton(`${DASHBOARD_INDIGO}40`, colors.card),
                        { opacity: pressed ? 0.9 : 1, flexDirection: dir },
                      ]}
                    >
                      <ClipboardList size={13} color={DASHBOARD_INDIGO} />
                    </Pressable>
                  </View>
                </View>
              );
            }

            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  surfaceCard(colors.card, colors.border),
                  { backgroundColor: `${DASHBOARD_INDIGO}06`, borderColor: `${DASHBOARD_INDIGO}18` },
                ]}
              >
                <View style={{ gap: 3 }}>
                  <View style={[styles.cardTop, { flexDirection: dir }]}>
                    <Text style={[styles.cardName, { color: colors.foreground, textAlign, flex: 1 }]}>
                      {item.patient_country ? `${countryFlagEmoji(item.patient_country)} ` : ""}
                      {item.patient_name}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${DASHBOARD_INDIGO}14` }]}>
                      <Text style={{ color: DASHBOARD_INDIGO, fontSize: 10, fontWeight: "700" }}>
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
                        backgroundColor: DASHBOARD_INDIGO,
                        opacity: pressed ? 0.88 : 1,
                        flexDirection: dir,
                      },
                    ]}
                  >
                    <MessageSquare size={14} color="#fff" />
                    <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                      {t.doctorDashboard.openChat}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openRecords(item.patient_id)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      secondaryButton(`${DASHBOARD_INDIGO}40`, colors.card),
                      { opacity: pressed ? 0.9 : 1, flexDirection: dir },
                    ]}
                  >
                    <ClipboardList size={14} color={DASHBOARD_INDIGO} />
                    <Text style={[styles.actionBtnText, { color: DASHBOARD_INDIGO }]}>
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  titleRow: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
    flex: 1,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: UI.radius.inner,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 360,
  },
  list: {
    gap: 0,
    borderRadius: UI.radius.inner,
    overflow: "hidden",
  },
  tableHeader: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: UI.radius.inner,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tableRow: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  colPatient: {
    flex: 3,
    minWidth: 0,
  },
  colStatus: {
    flex: 1,
    minWidth: 72,
    alignItems: "flex-start",
  },
  colDate: {
    flex: 2,
    minWidth: 100,
  },
  colActions: {
    flex: 2,
    minWidth: 140,
  },
  cellPatient: {
    gap: 2,
  },
  rowName: {
    fontSize: 13,
    fontWeight: "600",
  },
  rowDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  rowMeta: {
    fontSize: 11,
    lineHeight: 15,
  },
  rowActions: {
    justifyContent: "flex-end",
    gap: 6,
  },
  tableBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    minHeight: 32,
    paddingVertical: 6,
    borderRadius: UI.radius.inner,
  },
  tableBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  card: {
    padding: 12,
    gap: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  cardTop: {
    alignItems: "center",
    gap: 8,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  cardMeta: {
    fontSize: 11,
    lineHeight: 15,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: UI.radius.chip,
  },
  actions: {
    flexWrap: "wrap",
    gap: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 36,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
