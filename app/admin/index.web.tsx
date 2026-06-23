import { Redirect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import {
  fetchAdminDoctors,
  setDoctorApproval,
  type AdminDoctorRow,
} from "@/domains/admin/api";
import { getPostLogoutRoute } from "@/domains/auth/navigation";
import { useColors } from "@/hooks/useColors";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

function statusColor(status: string): string {
  if (status === "approved") return "#10b981";
  if (status === "rejected") return "#ef4444";
  return "#f59e0b";
}

export default function AdminPanelWeb() {
  const colors = useColors();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);

  const [doctors, setDoctors] = useState<AdminDoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const rows = await fetchAdminDoctors(accessToken);
      setDoctors(rows);
    } catch (e) {
      showErrorToast("Failed to load doctors", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isSignedIn(profile, accessToken)) {
    return <Redirect href="/auth/login" />;
  }

  if (role?.toLowerCase() !== "admin") {
    return <Redirect href="/welcome" />;
  }

  const pending = doctors.filter((d) => d.approval_status === "pending");
  const others = doctors.filter((d) => d.approval_status !== "pending");

  const handleApproval = async (
    doctorId: string,
    status: "approved" | "rejected",
  ) => {
    if (!accessToken) return;
    setActingId(doctorId);
    try {
      await setDoctorApproval(accessToken, doctorId, status);
      showSuccessToast(
        status === "approved" ? "Doctor approved" : "Doctor rejected",
      );
      await load();
    } catch (e) {
      showErrorToast("Action failed", (e as Error).message);
    } finally {
      setActingId(null);
    }
  };

  const renderDoctor = (doctor: AdminDoctorRow) => {
    const busy = actingId === doctor.id;
    const speciality =
      doctor.speciality?.name_en ?? doctor.speciality?.name_ar ?? "—";

    return (
      <View
        key={doctor.id}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.cardTop}>
          {doctor.photo_url ? (
            <Image source={{ uri: doctor.photo_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.muted }]} />
          )}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.name, { color: colors.foreground }]}>{doctor.name}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{doctor.email}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              {speciality} · {doctor.phone || "No phone"}
            </Text>
            <Text style={{ color: statusColor(doctor.approval_status), fontWeight: "700" }}>
              {doctor.approval_status}
            </Text>
          </View>
        </View>

        <View style={styles.docLinks}>
          {doctor.graduation_cert_url ? (
            <Pressable onPress={() => void Linking.openURL(doctor.graduation_cert_url!)}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Graduation cert</Text>
            </Pressable>
          ) : null}
          {doctor.work_permit_url ? (
            <Pressable onPress={() => void Linking.openURL(doctor.work_permit_url!)}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Work permit</Text>
            </Pressable>
          ) : null}
        </View>

        {doctor.approval_status === "pending" ? (
          <View style={styles.actions}>
            <Pressable
              disabled={busy}
              onPress={() => void handleApproval(doctor.id, "approved")}
              style={[styles.approveBtn, { opacity: busy ? 0.6 : 1 }]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.approveText}>Approve</Text>
              )}
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={() => void handleApproval(doctor.id, "rejected")}
              style={[styles.rejectBtn, { borderColor: "#ef4444", opacity: busy ? 0.6 : 1 }]}
            >
              <Text style={{ color: "#ef4444", fontWeight: "700" }}>Reject</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Admin — Doctor approvals</Text>
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
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Pending ({pending.length})
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : pending.length ? (
          pending.map(renderDoctor)
        ) : (
          <Text style={{ color: colors.mutedForeground }}>No pending doctor applications.</Text>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 28 }]}>
          All doctors ({others.length})
        </Text>
        {others.map(renderDoctor)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: "100%" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "800" },
  logoutBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  content: { padding: 24, gap: 12, maxWidth: 900, width: "100%", alignSelf: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  name: { fontSize: 17, fontWeight: "800" },
  docLinks: { flexDirection: "row", gap: 16 },
  actions: { flexDirection: "row", gap: 10 },
  approveBtn: {
    flex: 1,
    backgroundColor: "#10b981",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
  },
  approveText: { color: "#fff", fontWeight: "800" },
  rejectBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
  },
});
