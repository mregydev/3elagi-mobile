import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  fetchPatientConsultations,
  type PatientConsultation,
} from "@/domains/consultations/api";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { showErrorToast } from "@/utils/toast";
import { formatEgp } from "@/utils/credits";
import { flexRow } from "@/utils/rtl";

export function PatientConsultationsSection() {
  const colors = useColors();
  const { t, isRTL, locale } = useI18n();
  const accessToken = useAuthStore((s) => s.accessToken);
  const dir = flexRow(isRTL);
  const textAlign = isRTL ? "right" : "left";

  const [items, setItems] = useState<PatientConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setItems(await fetchPatientConsultations(accessToken));
    } catch (e) {
      showErrorToast(t.common.error, (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, t.common.error]);

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

  const statusMeta = (status: PatientConsultation["status"]) => {
    if (status === "open") return { color: colors.primary, text: t.consultations.open };
    if (status === "ended") return { color: "#0d9488", text: t.consultations.completed };
    return { color: "#dc2626", text: t.consultations.cancelled };
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={
        <Text style={[styles.listTitle, { color: colors.foreground, textAlign }]}>
          {t.consultations.myConsultations}
        </Text>
      }
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>
          {t.consultations.noConsultations}
        </Text>
      }
      renderItem={({ item }) => {
        const s = statusMeta(item.status);
        const date = new Date(item.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US");
        const Chevron = isRTL ? ChevronLeft : ChevronRight;
        return (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/chat/[id]",
                params: { id: item.doctor_id, consultationId: item.id },
              })
            }
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                flexDirection: dir,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.name, { color: colors.foreground, textAlign }]} numberOfLines={1}>
                {item.doctor_name}
              </Text>
              {item.description ? (
                <Text
                  style={[styles.desc, { color: colors.mutedForeground, textAlign }]}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              ) : null}
              <Text style={[styles.date, { color: colors.mutedForeground, textAlign }]}>
                {date} · {formatEgp(item.reserved_points, t)} {t.consultations.reserved}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: `${s.color}1F` }]}>
              <Text style={{ color: s.color, fontWeight: "800", fontSize: 12 }}>{s.text}</Text>
            </View>
            <Chevron size={18} color={colors.mutedForeground} />
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listTitle: { fontSize: 15, fontWeight: "800", marginBottom: 14 },
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
