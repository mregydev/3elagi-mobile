import { useFocusEffect } from "@react-navigation/native";
import { Wallet } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  fetchMyConsultations,
  type DoctorConsultation,
} from "@/domains/consultations/api";
import { fetchPointsBalance, reimbursePoints } from "@/domains/points/api";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { webConfirm } from "@/utils/webConfirm";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export function ConsultationsSection() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const accessToken = useAuthStore((s) => s.accessToken);
  const dir = isRTL ? "row-reverse" : "row";

  const [items, setItems] = useState<DoctorConsultation[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reimbursing, setReimbursing] = useState(false);

  const label = (en: string, ar: string) => (isRTL ? ar : en);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [list, summary] = await Promise.all([
        fetchMyConsultations(accessToken),
        fetchPointsBalance(accessToken),
      ]);
      setItems(list);
      setPoints(summary.message_points ?? 0);
    } catch (e) {
      showErrorToast(label("Error", "خطأ"), (e as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const doReimburse = async () => {
    if (!accessToken || points <= 0) return;
    setReimbursing(true);
    try {
      await reimbursePoints(accessToken);
      await load();
      showSuccessToast(label("Reimbursement requested", "تم طلب الاسترداد"));
    } catch (e) {
      showErrorToast(label("Reimburse failed", "تعذر الاسترداد"), (e as Error).message);
    } finally {
      setReimbursing(false);
    }
  };

  const confirmReimburse = () => {
    if (points <= 0) return;
    const title = label("Reimburse points", "استرداد النقاط");
    const msg = label(
      `Cash out your ${points} available points.`,
      `سيتم استرداد ${points} نقطة متاحة.`,
    );
    if (Platform.OS === "web") {
      if (webConfirm(title, msg)) void doReimburse();
      return;
    }
    Alert.alert(title, msg, [
      { text: label("Cancel", "إلغاء"), style: "cancel" },
      { text: label("Reimburse", "استرداد"), onPress: () => void doReimburse() },
    ]);
  };

  const statusMeta = (status: DoctorConsultation["status"]) => {
    if (status === "open") return { color: colors.primary, text: label("Open", "مفتوحة") };
    if (status === "ended") return { color: "#0d9488", text: label("Completed", "مكتملة") };
    return { color: "#dc2626", text: label("Cancelled", "ملغاة") };
  };

  const header = (
    <View style={[styles.reimburseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.reimburseLabel, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {label("Reimbursable points", "نقاط قابلة للاسترداد")}
      </Text>
      <View style={[styles.reimburseRow, { flexDirection: dir }]}>
        <Text style={[styles.reimburseValue, { color: colors.primary }]}>{points}</Text>
        <Pressable
          onPress={confirmReimburse}
          disabled={reimbursing || points <= 0}
          style={[
            styles.reimburseBtn,
            {
              backgroundColor: colors.primary,
              opacity: reimbursing || points <= 0 ? 0.5 : 1,
              flexDirection: dir,
            },
          ]}
        >
          {reimbursing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Wallet size={16} color="#fff" />
              <Text style={styles.reimburseBtnText}>{label("Reimburse", "استرداد")}</Text>
            </>
          )}
        </Pressable>
      </View>
      <Text style={[styles.listTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
        {label("My consultations", "استشاراتي")}
      </Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>
          {label("No consultations yet", "لا توجد استشارات بعد")}
        </Text>
      }
      renderItem={({ item }) => {
        const s = statusMeta(item.status);
        const date = new Date(item.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US");
        return (
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: dir }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.name, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
                {item.patient_name}
              </Text>
              {item.description ? (
                <Text
                  style={[styles.desc, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              ) : null}
              <Text style={[styles.date, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
                {date} · {item.reserved_points} {label("pts", "نقطة")}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: `${s.color}1F` }]}>
              <Text style={{ color: s.color, fontWeight: "800", fontSize: 12 }}>{s.text}</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  reimburseCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    gap: 8,
  },
  reimburseLabel: { fontSize: 13, fontWeight: "600" },
  reimburseRow: { alignItems: "center", justifyContent: "space-between", gap: 12 },
  reimburseValue: { fontSize: 34, fontWeight: "800" },
  reimburseBtn: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  reimburseBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  listTitle: { fontSize: 15, fontWeight: "800", marginTop: 6 },
  row: {
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  name: { fontSize: 15, fontWeight: "700" },
  desc: { fontSize: 13 },
  date: { fontSize: 12 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  empty: { textAlign: "center", marginTop: 32, fontSize: 14 },
});
