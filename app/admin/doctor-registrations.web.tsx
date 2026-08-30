import { Stethoscope } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AdminShell } from "@/components/admin/AdminShell.web";
import { patientCountryLabel } from "@/constants/patientCountries";
import {
  fetchAdminDoctorRegistration,
  fetchAdminDoctorRegistrations,
  type AdminDoctorRegistrationRow,
} from "@/domains/admin/api";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { showErrorToast } from "@/utils/toast";

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminDoctorRegistrationsWeb() {
  const colors = useColors();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [items, setItems] = useState<AdminDoctorRegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, AdminDoctorRegistrationRow>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setItems(await fetchAdminDoctorRegistrations(accessToken));
    } catch (e) {
      showErrorToast("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!details[id] && accessToken) {
      setLoadingDetail(true);
      try {
        const row = await fetchAdminDoctorRegistration(accessToken, id);
        setDetails((prev) => ({ ...prev, [id]: row }));
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, read_at: row.read_at } : item,
          ),
        );
      } catch (e) {
        showErrorToast("Error", (e as Error).message);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  return (
    <AdminShell
      title="Doctor registrations"
      subtitle="Doctors who requested to register and test the app."
    >
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : items.length === 0 ? (
          <Text style={{ color: colors.mutedForeground, marginTop: 24 }}>
            No registration requests yet.
          </Text>
        ) : (
          items.map((item) => {
            const open = expanded === item.id;
            const detail = details[item.id];
            const unread = !item.read_at;
            const row = detail ?? item;
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: unread ? `${colors.primary}55` : colors.border,
                  },
                ]}
              >
                <Pressable onPress={() => void toggle(item.id)} style={styles.cardHead}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.titleRow}>
                      <Stethoscope size={16} color={colors.primary} />
                      <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                        {item.doctor_name}
                      </Text>
                      {unread ? (
                        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.badgeText}>New</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                      {item.email}
                      {" · "}
                      {item.phone}
                      {" · "}
                      {patientCountryLabel(item.country, false)}
                      {" · "}
                      {fmt(item.created_at)}
                    </Text>
                    {!open ? (
                      <Text
                        style={{ color: colors.foreground, fontSize: 13, lineHeight: 18 }}
                        numberOfLines={1}
                      >
                        {item.speciality_name_en}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>
                    {open ? "Hide" : "View"}
                  </Text>
                </Pressable>

                {open ? (
                  <View style={styles.detail}>
                    {loadingDetail && !detail ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <View style={{ gap: 8 }}>
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                          Speciality
                        </Text>
                        <Text style={[styles.message, { color: colors.foreground }]}>
                          {row.speciality_name_en}
                          {row.speciality_name_ar !== row.speciality_name_en
                            ? ` · ${row.speciality_name_ar}`
                            : ""}
                        </Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                          Email
                        </Text>
                        <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                          {row.email}
                        </Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                          Phone
                        </Text>
                        <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                          {row.phone}
                        </Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                          Country
                        </Text>
                        <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                          {patientCountryLabel(row.country, false)}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 12, paddingBottom: 40 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  detail: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.25)",
    paddingTop: 12,
  },
  message: { fontSize: 14, lineHeight: 20 },
});
