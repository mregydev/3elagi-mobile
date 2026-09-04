import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AdminShell } from "@/components/admin/AdminShell.web";
import {
  fetchAdminLoginAnalytics,
  type AdminLoginStatRow,
} from "@/domains/admin/api";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { showErrorToast } from "@/utils/toast";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminAnalyticsWeb() {
  const colors = useColors();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [rows, setRows] = useState<AdminLoginStatRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows(await fetchAdminLoginAnalytics(accessToken));
    } catch (e) {
      showErrorToast("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalVisits = useMemo(
    () => rows.reduce((sum, row) => sum + row.login_count, 0),
    [rows],
  );

  return (
    <AdminShell
      title="Analytics"
      subtitle="User logins and home-page visits. Each sign-in and home tab open increments the counter."
    >
      <View style={[styles.summaryRow, { borderColor: colors.border }]}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Users tracked</Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>{rows.length}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total visits</Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>{totalVisits}</Text>
        </View>
      </View>

      <View style={[styles.tableHead, { borderBottomColor: colors.border }]}>
        <Text style={[styles.th, styles.emailCol, { color: colors.mutedForeground }]}>Email</Text>
        <Text style={[styles.th, styles.countCol, { color: colors.mutedForeground }]}>Logins</Text>
        <Text style={[styles.th, styles.dateCol, { color: colors.mutedForeground }]}>Last visit</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : rows.length === 0 ? (
        <Text style={{ color: colors.mutedForeground, padding: 24, textAlign: "center" }}>
          No visits recorded yet. Counts appear after users sign in or open the home tab.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.tableBody}>
          {rows.map((row) => (
            <View
              key={row.user_id}
              style={[styles.tr, { borderBottomColor: colors.border, backgroundColor: colors.card }]}
            >
              <Text style={[styles.td, styles.emailCol, { color: colors.foreground }]} numberOfLines={1}>
                {row.email}
              </Text>
              <Text style={[styles.td, styles.countCol, { color: colors.primary, fontWeight: "800" }]}>
                {row.login_count}
              </Text>
              <Text style={[styles.td, styles.dateCol, { color: colors.mutedForeground }]}>
                {fmt(row.last_login_at)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  summaryLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  summaryValue: { fontSize: 28, fontWeight: "800" },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  th: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  tableBody: { paddingHorizontal: 24, paddingBottom: 40 },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  td: { fontSize: 14 },
  emailCol: { flex: 2, minWidth: 0 },
  countCol: { flex: 0.6, textAlign: "center" },
  dateCol: { flex: 1.2, textAlign: "right", fontSize: 13 },
});
