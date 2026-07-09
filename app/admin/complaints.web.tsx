import { Redirect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { getPostLogoutRoute } from "@/domains/auth/navigation";
import {
  fetchComplaintMessages,
  fetchComplaints,
  resolveComplaint,
  type AdminComplaint,
  type ComplaintMessage,
} from "@/domains/complaints/api";
import { useColors } from "@/hooks/useColors";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

function statusColor(status: string): string {
  if (status === "accepted") return "#10b981";
  if (status === "rejected") return "#ef4444";
  return "#f59e0b";
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminComplaintsWeb() {
  const colors = useColors();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);

  const [items, setItems] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ComplaintMessage[]>>({});
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setItems(await fetchComplaints(accessToken));
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
    if (!messages[id] && accessToken) {
      setLoadingMsgs(true);
      try {
        const rows = await fetchComplaintMessages(accessToken, id);
        setMessages((prev) => ({ ...prev, [id]: rows }));
      } catch (e) {
        showErrorToast("Error", (e as Error).message);
      } finally {
        setLoadingMsgs(false);
      }
    }
  };

  const resolve = async (id: string, action: "accept" | "reject") => {
    if (!accessToken) return;
    setActingId(id);
    try {
      await resolveComplaint(accessToken, id, action);
      showSuccessToast(action === "accept" ? "Complaint accepted — points refunded" : "Complaint rejected");
      await load();
    } catch (e) {
      showErrorToast("Error", (e as Error).message);
    } finally {
      setActingId(null);
    }
  };

  if (!isSignedIn(profile, accessToken) || role?.toLowerCase() !== "admin") {
    return <Redirect href="/welcome" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.foreground }]}>Admin — Complaints</Text>
          <View style={styles.navRow}>
            <Pressable
              onPress={() => router.push("/admin")}
              style={[styles.navBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.foreground, fontWeight: "700" }}>Doctors</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/admin/rag")}
              style={[styles.navBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.foreground, fontWeight: "700" }}>RAG Sources</Text>
            </Pressable>
            <View style={[styles.navBtn, { borderColor: colors.primary, backgroundColor: `${colors.primary}14` }]}>
              <Text style={{ color: colors.primary, fontWeight: "800" }}>Complaints</Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => {
            logout();
            router.replace(getPostLogoutRoute());
          }}
          style={[styles.logoutBtn, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.foreground, fontWeight: "700" }}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : items.length === 0 ? (
          <Text style={{ color: colors.mutedForeground, marginTop: 24 }}>No complaints.</Text>
        ) : (
          items.map((c) => {
            const open = expanded === c.id;
            return (
              <View
                key={c.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                      {c.patient_name} → {c.doctor_name}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                      {fmt(c.created_at)} · {c.points} pts
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: `${statusColor(c.status)}22` }]}>
                    <Text style={{ color: statusColor(c.status), fontWeight: "800", fontSize: 12 }}>
                      {c.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.reason, { color: colors.foreground }]}>{c.reason}</Text>

                <Pressable onPress={() => void toggle(c.id)}>
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>
                    {open ? "Hide consultation" : "View consultation"}
                  </Text>
                </Pressable>

                {open ? (
                  loadingMsgs && !messages[c.id] ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />
                  ) : (
                    <View style={[styles.thread, { borderColor: colors.border }]}>
                      {(messages[c.id] ?? []).length === 0 ? (
                        <Text style={{ color: colors.mutedForeground }}>No messages.</Text>
                      ) : (
                        (messages[c.id] ?? []).map((m) => (
                          <View key={m.id} style={styles.msgRow}>
                            <Text style={{ color: colors.mutedForeground, fontSize: 11, minWidth: 150 }}>
                              {fmt(m.datetime)}
                            </Text>
                            <Text
                              style={{
                                color: m.from === "patient" ? colors.primary : "#0d9488",
                                fontWeight: "800",
                                fontSize: 12,
                                minWidth: 70,
                              }}
                            >
                              {m.from === "patient" ? "Patient" : "Doctor"}
                            </Text>
                            <Text style={{ color: colors.foreground, flex: 1 }}>
                              {m.type === "text" ? m.content : `[${m.type}] ${m.content}`}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  )
                ) : null}

                {c.status === "pending" ? (
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => void resolve(c.id, "accept")}
                      disabled={actingId === c.id}
                      style={[styles.acceptBtn, { opacity: actingId === c.id ? 0.6 : 1 }]}
                    >
                      <Text style={{ color: "#fff", fontWeight: "800" }}>Accept (refund patient)</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void resolve(c.id, "reject")}
                      disabled={actingId === c.id}
                      style={[styles.rejectBtn, { borderColor: "#dc2626", opacity: actingId === c.id ? 0.6 : 1 }]}
                    >
                      <Text style={{ color: "#dc2626", fontWeight: "800" }}>Reject</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: { gap: 10 },
  title: { fontSize: 22, fontWeight: "800" },
  navRow: { flexDirection: "row", gap: 8 },
  navBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  logoutBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  content: { padding: 24, gap: 14, maxWidth: 900, width: "100%", alignSelf: "center" },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  reason: { fontSize: 14, lineHeight: 20 },
  thread: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8, marginTop: 4 },
  msgRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  acceptBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
  },
  rejectBtn: {
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
