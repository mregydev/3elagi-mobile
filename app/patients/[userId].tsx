import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DoctorPatientAccessDenied } from "@/components/DoctorPatientAccessDenied";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { MedicalHistoryList } from "@/components/MedicalHistoryList";
import { useAuthStore } from "@/domains/auth/store";
import {
  canDoctorViewPatientRecords,
  fetchDoctorPatientAccess,
  type DoctorPatientAccessStatus,
} from "@/domains/chat/access";
import { fetchPatientMedicalHistoryAsDoctor } from "@/domains/medical/api";
import type { MedicalRecord } from "@/domains/medical/types";
import { useMedicalStore } from "@/domains/medical/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

export default function PatientRecordScreen() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const consumePendingRefresh = useMedicalStore((s) => s.consumePendingRefresh);
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [accessStatus, setAccessStatus] = useState<DoctorPatientAccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isDoctor = role?.toLowerCase() === "doctor";
  const dir = isRTL ? "row-reverse" : "row";
  const patientName = name?.trim() || (isRTL ? "المريض" : "Patient");
  const hasAccess = canDoctorViewPatientRecords(accessStatus);

  const loadScreen = useCallback(async () => {
    if (!accessToken || !userId || !isDoctor) return;

    const status = await fetchDoctorPatientAccess(accessToken, userId);
    setAccessStatus(status);

    if (!canDoctorViewPatientRecords(status)) {
      setRecords([]);
      return;
    }

    const data = await fetchPatientMedicalHistoryAsDoctor(userId, accessToken);
    setRecords(data);
  }, [accessToken, userId, isDoctor]);

  useEffect(() => {
    if (!isDoctor || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadScreen()
      .catch(() => {
        setAccessStatus(null);
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, [isDoctor, userId, loadScreen]);

  useFocusEffect(
    useCallback(() => {
      if (!isDoctor || !userId) return;
      consumePendingRefresh();
      void loadScreen().catch(() => {
        setRecords([]);
      });
    }, [isDoctor, userId, consumePendingRefresh, loadScreen]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadScreen();
    } catch {
      setRecords([]);
    } finally {
      setRefreshing(false);
    }
  };

  if (!isDoctor) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>
          {isRTL ? "للأطباء فقط" : "For doctors only"}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
            flexDirection: dir,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          {isRTL ? (
            <ArrowRight size={22} color={colors.primary} />
          ) : (
            <ArrowLeft size={22} color={colors.primary} />
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {isRTL ? `سجل ${patientName}` : `${patientName}'s record`}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : !hasAccess ? (
        <DoctorPatientAccessDenied isRTL={isRTL} />
      ) : (
        <KeyboardSafeScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          <MedicalHistoryList
            records={records}
            patientUserId={userId!}
            canAdd
            doctorView
            showIntake={false}
          />
        </KeyboardSafeScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "800" },
});
