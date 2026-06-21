import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, ArrowRight, ChevronRight, Users } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { DoctorPatientAccessDenied } from "@/components/DoctorPatientAccessDenied";
import { MedicalHistoryList } from "@/components/MedicalHistoryList";
import { PatientSearchFilterPanel } from "@/components/PatientSearchFilterPanel";
import { useAuthStore } from "@/domains/auth/store";
import {
  canDoctorViewPatientRecords,
  fetchDoctorPatientAccess,
  type DoctorPatientAccessStatus,
} from "@/domains/chat/access";
import {
  fetchDoctorPatients,
  fetchPatientMedicalHistoryAsDoctor,
  type DoctorPatientListItem,
} from "@/domains/medical/api";
import type { MedicalRecord } from "@/domains/medical/types";
import { useMedicalStore } from "@/domains/medical/store";
import {
  EMPTY_PATIENT_FILTERS,
  filterPatients,
  hasActivePatientFilters,
  type PatientSearchFilters,
} from "@/domains/patients/search";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

type SelectedPatient = { userId: string; name: string };

export default function PatientsTab() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const consumePendingRefresh = useMedicalStore((s) => s.consumePendingRefresh);

  const [patients, setPatients] = useState<DoctorPatientListItem[]>([]);
  const [selected, setSelected] = useState<SelectedPatient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [accessStatus, setAccessStatus] = useState<DoctorPatientAccessStatus | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientFilters, setPatientFilters] = useState<PatientSearchFilters>(EMPTY_PATIENT_FILTERS);

  const isDoctor = role?.toLowerCase() === "doctor";
  const dir = isRTL ? "row-reverse" : "row";

  const filteredPatients = useMemo(
    () => filterPatients(patients, patientFilters),
    [patients, patientFilters],
  );

  const loadPatients = useCallback(async () => {
    if (!accessToken) return;
    try {
      setError(null);
      const data = await fetchDoctorPatients(accessToken);
      setPatients(data);
    } catch (e) {
      setError((e as Error).message);
      setPatients([]);
    }
  }, [accessToken]);

  const loadRecords = useCallback(
    async (userId: string) => {
      if (!accessToken) return;
      setLoadingRecords(true);
      setError(null);
      try {
        const status = await fetchDoctorPatientAccess(accessToken, userId);
        setAccessStatus(status);
        if (!canDoctorViewPatientRecords(status)) {
          setRecords([]);
          return;
        }
        const data = await fetchPatientMedicalHistoryAsDoctor(userId, accessToken);
        setRecords(data);
      } catch (e) {
        setError((e as Error).message);
        setRecords([]);
        setAccessStatus(null);
      } finally {
        setLoadingRecords(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    if (!isDoctor) {
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    loadPatients().finally(() => setLoadingList(false));
  }, [isDoctor, loadPatients]);

  useFocusEffect(
    useCallback(() => {
      if (!isDoctor || !accessToken || selected) return;
      loadPatients();
    }, [isDoctor, accessToken, selected, loadPatients]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!selected?.userId) return;
      consumePendingRefresh();
      loadRecords(selected.userId);
    }, [selected?.userId, consumePendingRefresh, loadRecords]),
  );

  useEffect(() => {
    if (selected) loadRecords(selected.userId);
    else setRecords([]);
  }, [selected, loadRecords]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (selected) {
      await Promise.all([loadPatients(), loadRecords(selected.userId)]);
    } else {
      await loadPatients();
    }
    setRefreshing(false);
  };

  const openPatient = (item: DoctorPatientListItem) => {
    setSelected({ userId: item.user_id, name: item.name });
  };

  const backToList = () => {
    setSelected(null);
    setRecords([]);
    setAccessStatus(null);
    setError(null);
  };

  const hasAccess = canDoctorViewPatientRecords(accessStatus);

  if (!profile || !isDoctor) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader />
        <View style={styles.center}>
          <Text style={{ color: colors.mutedForeground }}>
            {isRTL ? "للأطباء فقط" : "For doctors only"}
          </Text>
        </View>
      </View>
    );
  }

  const headingTitle = selected
    ? isRTL
      ? `سجل ${selected.name}`
      : `${selected.name}'s record`
    : isRTL
      ? "المرضى"
      : "Patients";

  const listHeader = !selected && !loadingList && !error ? (
    <Text style={[styles.listHint, { color: colors.mutedForeground }]}>
      {patients.length === 0
        ? isRTL
          ? "لا يوجد مرضى مسجّلون"
          : "No registered patients"
        : hasActivePatientFilters(patientFilters)
          ? filteredPatients.length === 0
            ? isRTL
              ? "لا توجد نتائج للبحث"
              : "No patients match your search"
            : isRTL
              ? `${filteredPatients.length} من ${patients.length} — اختر مريضًا`
              : `${filteredPatients.length} of ${patients.length} — select a patient`
          : isRTL
            ? `${patients.length} مريض — اختر مريضًا لعرض سجله`
            : `${patients.length} patient${patients.length === 1 ? "" : "s"} — select one to view their record`}
    </Text>
  ) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader />
      <View style={[styles.heading, { flexDirection: dir }]}>
        {selected ? (
          <Pressable onPress={backToList} style={styles.backBtn} hitSlop={8}>
            {isRTL ? (
              <ArrowRight size={22} color={colors.primary} />
            ) : (
              <ArrowLeft size={22} color={colors.primary} />
            )}
          </Pressable>
        ) : (
          <Users size={22} color={colors.primary} />
        )}
        <Text style={[styles.h1, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
          {headingTitle}
        </Text>
      </View>

      {selected ? (
        loadingRecords ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : !hasAccess ? (
          <DoctorPatientAccessDenied isRTL={isRTL} />
        ) : error ? (
          <View style={styles.center}>
            <Text style={{ color: "#ef4444", textAlign: "center", paddingHorizontal: 24 }}>
              {error}
            </Text>
            <Pressable
              onPress={() => loadRecords(selected.userId)}
              style={[styles.retryBtn, { borderColor: colors.primary }]}
            >
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                {isRTL ? "إعادة المحاولة" : "Retry"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <KeyboardSafeScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          >
            <MedicalHistoryList
              records={records}
              patientUserId={selected.userId}
              canAdd
              doctorView
              showIntake={false}
            />
          </KeyboardSafeScrollView>
        )
      ) : loadingList ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: "#ef4444", textAlign: "center", paddingHorizontal: 24 }}>
            {error}
          </Text>
          <Pressable onPress={loadPatients} style={[styles.retryBtn, { borderColor: colors.primary }]}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {isRTL ? "إعادة المحاولة" : "Retry"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.listSection}>
          <PatientSearchFilterPanel
            filters={patientFilters}
            onChange={setPatientFilters}
            isRTL={isRTL}
            dir={dir}
          />
          <FlatList
            style={styles.list}
            data={filteredPatients}
            keyExtractor={(p) => p.user_id}
            ListHeaderComponent={listHeader}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => openPatient(item)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    flexDirection: dir,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={[
                      styles.name,
                      { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.phone ? (
                    <Text
                      style={[
                        styles.sub,
                        { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {item.phone}
                    </Text>
                  ) : null}
                  {item.email ? (
                    <Text
                      style={[
                        styles.sub,
                        { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                      ]}
                      numberOfLines={1}
                    >
                      {item.email}
                    </Text>
                  ) : null}
                </View>
                <ChevronRight
                  size={20}
                  color={colors.mutedForeground}
                  style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined}
                />
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  heading: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: { padding: 4 },
  h1: { fontSize: 20, fontWeight: "800" },
  listSection: { flex: 1 },
  list: { flex: 1 },
  listHint: {
    fontSize: 13,
    marginBottom: 12,
    marginTop: 4,
    textAlign: "center",
  },
  row: {
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: "700" },
  sub: { fontSize: 13 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});
