import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { Beaker, FileDown, ScanLine, Upload } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  fetchMedicalDocumentRequestPdf,
  fetchMyMedicalDocumentRequests,
  type MedicalDocumentRequest,
} from "@/domains/medical/api";
import { buildMedicalAddEntryHref } from "@/domains/medical/addHref";
import { useAuthStore } from "@/domains/auth/store";
import { useApiLang } from "@/hooks/useApiLang";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { showAppAlert } from "@/utils/appAlert";
import { flexRow } from "@/utils/rtl";

export function PatientMedicalRequestsPanel() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const apiLang = useApiLang();
  const dir = flexRow(isRTL);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<MedicalDocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const rows = await fetchMyMedicalDocumentRequests(accessToken);
      setItems(rows.filter((r) => r.status === "pending"));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const printPdf = async (id: string) => {
    if (!accessToken) return;
    setPrintingId(id);
    try {
      const { pdf_url } = await fetchMedicalDocumentRequestPdf(id, accessToken, apiLang);
      if (!pdf_url) throw new Error("PDF unavailable");
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.open(pdf_url, "_blank", "noopener,noreferrer");
      } else {
        await Linking.openURL(pdf_url);
      }
    } catch (err) {
      showAppAlert(isRTL ? "فشل الطباعة" : "Print failed", (err as Error).message);
    } finally {
      setPrintingId(null);
    }
  };

  const fulfill = (request: MedicalDocumentRequest) => {
    router.push(
      buildMedicalAddEntryHref({
        isPatient: true,
        requestId: request.id,
        category: request.type,
      }) as never,
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (items.length === 0) return null;

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.heading, { color: colors.foreground }]}>
        {t.records.pendingRequests}
      </Text>
      <View style={styles.list}>
        {items.map((item) => {
          const Icon = item.type === "lab" ? Beaker : ScanLine;
          return (
            <View
              key={item.id}
              style={[styles.row, { borderColor: colors.border, backgroundColor: colors.background }]}
            >
              <View style={[styles.rowTop, { flexDirection: dir }]}>
                <View style={[styles.iconBubble, { backgroundColor: `${colors.primary}14` }]}>
                  <Icon size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text
                      style={[styles.itemDesc, { color: colors.mutedForeground }]}
                      numberOfLines={3}
                    >
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={[styles.actions, { flexDirection: dir }]}>
                <Pressable
                  onPress={() => void printPdf(item.id)}
                  style={[styles.actionBtn, { borderColor: colors.border }]}
                >
                  {printingId === item.id ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <FileDown size={14} color={colors.primary} />
                  )}
                  <Text style={[styles.actionLabel, { color: colors.primary }]}>
                    {t.records.printRequest}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => fulfill(item)}
                  style={[styles.actionBtn, { borderColor: colors.primary, backgroundColor: `${colors.primary}12` }]}
                >
                  <Upload size={14} color={colors.primary} />
                  <Text style={[styles.actionLabel, { color: colors.primary }]}>
                    {t.records.fulfillRequest}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 12 },
  wrap: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  heading: { fontSize: 15, fontWeight: "800" },
  list: { gap: 10 },
  row: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  rowTop: { alignItems: "flex-start", gap: 10 },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: { fontSize: 14, fontWeight: "800" },
  itemDesc: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  actions: { gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 12, fontWeight: "800" },
});
