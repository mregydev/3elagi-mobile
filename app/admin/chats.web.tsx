import { router } from "expo-router";
import { MessageSquare, Search } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AdminShell } from "@/components/admin/AdminShell.web";
import { AppTextInput } from "@/components/AppTextInput";
import { Avatar } from "@/components/Avatar";
import {
  fetchAdminDoctors,
  fetchAdminPatients,
  type AdminDoctorRow,
  type AdminPatientRow,
} from "@/domains/admin/api";
import { chatRepository } from "@/domains/chat/repository";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { showErrorToast } from "@/utils/toast";

type Tab = "doctors" | "patients";

type Member = {
  userId: string;
  name: string;
  photoUrl?: string | null;
  detail?: string | null;
  role: "doctor" | "patient";
};

/** Support inbox: every doctor and patient, one tap from a chat with them. */
export default function AdminChatsWeb() {
  const colors = useColors();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [tab, setTab] = useState<Tab>("doctors");
  const [doctors, setDoctors] = useState<AdminDoctorRow[]>([]);
  const [patients, setPatients] = useState<AdminPatientRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [doctorRows, patientRows] = await Promise.all([
        fetchAdminDoctors(accessToken),
        fetchAdminPatients(accessToken),
      ]);
      setDoctors(doctorRows);
      setPatients(patientRows);
    } catch (e) {
      showErrorToast("Could not load members", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const members: Member[] = useMemo(() => {
    const rows: Member[] =
      tab === "doctors"
        ? doctors
            // A doctor with no user account cannot be messaged.
            .filter((d) => !!d.user_id)
            .map((d) => ({
              userId: d.user_id,
              name: d.name,
              photoUrl: d.photo_url,
              detail: d.speciality?.name_en ?? d.email,
              role: "doctor" as const,
            }))
        : patients
            .filter((p) => !!p.user_id)
            .map((p) => ({
              userId: p.user_id,
              name: p.name,
              photoUrl: p.photo_url,
              detail: p.phone ?? p.country,
              role: "patient" as const,
            }));

    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.detail ?? "").toLowerCase().includes(q),
    );
  }, [tab, doctors, patients, query]);

  const openChat = (member: Member) => {
    // Seed the peer so the chat header has a name before the first message.
    chatRepository.cacheUsers([
      {
        id: member.userId,
        name: member.name,
        photoUrl: member.photoUrl,
        presence: "offline",
        role: member.role,
      },
    ]);
    router.push(`/chat/${member.userId}`);
  };

  return (
    <AdminShell
      title="Chats"
      subtitle="Message any doctor or patient directly."
    >
      <View style={[styles.tabs, { borderColor: colors.border }]}>
        {(["doctors", "patients"] as Tab[]).map((key) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? colors.primary : "transparent",
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.primaryForeground : colors.foreground,
                  fontWeight: "700",
                  fontSize: 13,
                  textTransform: "capitalize",
                }}
              >
                {key}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.search, { borderColor: colors.border }]}>
        <Search size={16} color={colors.mutedForeground} />
        <AppTextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name…"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
      ) : members.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>
          No {tab} found.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {members.map((member) => (
            <Pressable
              key={member.userId}
              onPress={() => openChat(member)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Avatar
                uri={member.photoUrl ?? null}
                seed={member.userId}
                role={member.role}
                size={40}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[styles.name, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {member.name}
                </Text>
                {member.detail ? (
                  <Text
                    style={[styles.detail, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {member.detail}
                  </Text>
                ) : null}
              </View>
              <MessageSquare size={18} color={colors.primary} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14 },
  list: { gap: 8, paddingBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  name: { fontSize: 14, fontWeight: "700" },
  detail: { fontSize: 12, marginTop: 2 },
  empty: { marginTop: 32, textAlign: "center", fontSize: 14 },
});
