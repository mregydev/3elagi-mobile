import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppBackButton } from "@/components/nav/AppBackButton";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DoctorPatientAccessDenied } from "@/components/DoctorPatientAccessDenied";
import { MedicalHistoryList } from "@/components/MedicalHistoryList";
import type { RecordsViewMode } from "@/components/records/RecordsViewModeToggle";
import { useAuthStore } from "@/domains/auth/store";
import {
  canDoctorViewPatientRecords,
  fetchDoctorPatientAccess,
  type DoctorPatientAccessStatus,
} from "@/domains/chat/access";
import { fetchPatientMedicalHistoryAsDoctor } from "@/domains/medical/api";
import type { MedicalRecord } from "@/domains/medical/types";
import { useMedicalStore } from "@/domains/medical/store";
import {
  currentTourStep,
  useProductTourStore,
} from "@/domains/onboarding/productTourStore";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { WEB_CONTENT_PADDING } from "@/constants/webLayout";
import { useWebLayout } from "@/hooks/useWebLayout";
import { navigateBack } from "@/utils/appNavigation";
import { readRouteParam } from "@/utils/routeParams";

export default function PatientRecordScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const consumePendingRefresh = useMedicalStore((s) => s.consumePendingRefresh);
  const advanceOnAnchorTap = useProductTourStore((s) => s.advanceOnAnchorTap);
  const tourActive = useProductTourStore((s) => s.active);
  const tourPhase = useProductTourStore((s) => s.phase);
  const tourStepIndex = useProductTourStore((s) => s.stepIndex);
  const params = useLocalSearchParams<{ userId?: string | string[]; name?: string | string[] }>();
  const userId = readRouteParam(params.userId);
  const name = readRouteParam(params.name);

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [accessStatus, setAccessStatus] = useState<DoctorPatientAccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recordsViewMode, setRecordsViewMode] = useState<RecordsViewMode>("table");
  /** Non-scrolling host so split dashboard / skeleton get a real flex height (web + native). */
  const fixedBodyHost =
    recordsViewMode === "skeleton" || (isDesktop && recordsViewMode === "table");

  const isDoctor = role?.toLowerCase() === "doctor";
  const dir = isRTL ? "row-reverse" : "row";
  const patientName = name || (isRTL ? "المريض" : "Patient");
  const hasAccess = canDoctorViewPatientRecords(accessStatus);

  const loadScreen = useCallback(async () => {
    if (!accessToken || !userId || !isDoctor) return;

    setLoadError(null);
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
    if (!tourActive) return;
    const step = currentTourStep(tourPhase, tourStepIndex);
    if (step?.anchor === "records-skeleton-body") {
      setRecordsViewMode("skeleton");
    }
  }, [tourActive, tourPhase, tourStepIndex]);

  useEffect(() => {
    if (!isDoctor || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadScreen()
      .catch((e) => {
        setAccessStatus(null);
        setRecords([]);
        setLoadError(e instanceof Error ? e.message : "Failed to load patient");
      })
      .finally(() => setLoading(false));
  }, [isDoctor, userId, loadScreen]);

  useFocusEffect(
    useCallback(() => {
      if (!isDoctor || !userId) return;
      consumePendingRefresh();
      void loadScreen().catch((e) => {
        setRecords([]);
        setLoadError(e instanceof Error ? e.message : "Failed to load patient");
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

  const historyList = (
    <MedicalHistoryList
      records={records}
      patientUserId={userId!}
      patientLabel={patientName}
      canAdd={false}
      doctorView
      showIntake
      viewMode={recordsViewMode}
      onViewModeChange={setRecordsViewMode}
      onRecordsChanged={() => {
        void loadScreen().catch(() => setRecords([]));
      }}
    />
  );

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
        <AppBackButton
          testID="records-back"
          color={colors.primary}
          style={styles.backBtn}
          hitSlop={12}
          fallback="/(tabs)/history"
          accessibilityLabel={isRTL ? "رجوع" : "Back"}
          onPress={() => {
            advanceOnAnchorTap("records-back");
            navigateBack(router, "/(tabs)/history");
          }}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {isRTL ? `سجل ${patientName}` : `${patientName}'s record`}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={{ color: "#ef4444", textAlign: "center", paddingHorizontal: 24 }}>
            {loadError}
          </Text>
        </View>
      ) : !hasAccess ? (
        <DoctorPatientAccessDenied isRTL={isRTL} />
      ) : fixedBodyHost ? (
        // Non-scrolling host so the split dashboard / skeleton toggle stays pressable.
        <View style={styles.body}>
          {historyList}
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {historyList}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  body: { flex: 1, minHeight: 0 },
  // Do not use flexGrow:1 — it pins content to the viewport and kills scrolling on web.
  bodyContent: { paddingBottom: 96 },
  bottomSpacer: { height: 48, width: "100%" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: WEB_CONTENT_PADDING,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "800" },
});
