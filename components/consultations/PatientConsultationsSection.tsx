import { useFocusEffect } from "@react-navigation/native";
import { MessageCircle } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PatientConsultationCard } from "@/components/consultations/PatientConsultationCard";
import { emptyStateSurface, UI } from "@/constants/uiTokens";
import {
  fetchPatientConsultations,
  type PatientConsultation,
} from "@/domains/consultations/api";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { showErrorToast } from "@/utils/toast";

export function PatientConsultationsSection() {
  const colors = useColors();
  const { t, isRTL, locale } = useI18n();
  const accessToken = useAuthStore((s) => s.accessToken);
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
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <View style={[styles.empty, emptyStateSurface(colors.card, colors.border)]}>
          <MessageCircle size={22} color={colors.mutedForeground} strokeWidth={1.75} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {t.consultations.noConsultations}
          </Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            {isRTL
              ? "ستظهر استشاراتك هنا بعد بدء محادثة مع طبيب."
              : "Your consultations will appear here after you start a chat with a doctor."}
          </Text>
        </View>
      }
      renderItem={({ item }) => <PatientConsultationCard item={item} locale={locale} />}
      ItemSeparatorComponent={() => <View style={{ height: UI.space.sm }} />}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: UI.space.md,
    paddingBottom: UI.space.lg,
    gap: UI.space.sm,
  },
  listTitle: {
    ...UI.type.section,
    marginBottom: UI.space.sm,
  },
  empty: {
    marginTop: UI.space.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 280,
  },
});
