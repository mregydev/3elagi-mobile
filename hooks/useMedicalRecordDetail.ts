import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { IMAGE_EXTS, MEDICAL_RECORD_CATEGORY_META } from "@/components/medical/medicalRecordMeta";
import { useAuthStore } from "@/domains/auth/store";
import {
  canDoctorViewPatientRecords,
  fetchDoctorPatientAccess,
  type DoctorPatientAccessStatus,
} from "@/domains/chat/access";
import {
  addSymptomToDiagnosis,
  deletePatientMedicalDocument,
  fetchAllMedicalHistory,
  fetchDiagnosisById,
  fetchDoctorDiagnosisById,
  fetchDocumentsForPatientUser,
  fetchPatientDocuments,
  fetchPrescriptionById,
  updateDiagnosis,
} from "@/domains/medical/api";
import { useMedicalStore } from "@/domains/medical/store";
import type { MedicalRecord } from "@/domains/medical/types";
import {
  canAddDiagnosisSymptom,
  canDeleteMedicalRecord,
  canEditDiagnosis,
} from "@/domains/medical/permissions";

export function useMedicalRecordDetail(isRTL: boolean) {
  const { id, doctorView, patientUserId } = useLocalSearchParams<{
    id: string;
    doctorView?: string;
    patientUserId?: string;
  }>();

  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const doctorId = useAuthStore((s) => s.doctorId);
  const isDoctorView = doctorView === "1";
  const records = useMedicalStore((s) => s.records);
  const remove = useMedicalStore((s) => s.remove);
  const upsertDiagnosis = useMedicalStore((s) => s.upsertDiagnosis);
  const upsertPrescription = useMedicalStore((s) => s.upsertPrescription);
  const setRecordsFromApi = useMedicalStore((s) => s.setRecordsFromApi);
  const notifyMedicalHistoryChanged = useMedicalStore((s) => s.notifyMedicalHistoryChanged);

  const [detail, setDetail] = useState<MedicalRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "done">("loading");
  const [newSymptom, setNewSymptom] = useState("");
  const [addingSymptom, setAddingSymptom] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editingDiagnosis, setEditingDiagnosis] = useState(false);
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [zoomImageUri, setZoomImageUri] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<DoctorPatientAccessStatus | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);

  const needsDoctorAccess = isDoctorView && !!patientUserId;
  const hasDoctorAccess =
    !needsDoctorAccess || canDoctorViewPatientRecords(accessStatus);

  const cached = records.find((r) => r.id === id);
  const record = hasDoctorAccess ? detail ?? cached : null;

  useEffect(() => {
    if (!needsDoctorAccess || !accessToken || !patientUserId) {
      setAccessChecked(true);
      setAccessStatus(null);
      return;
    }
    setAccessChecked(false);
    void fetchDoctorPatientAccess(accessToken, patientUserId)
      .then(setAccessStatus)
      .catch(() => setAccessStatus(null))
      .finally(() => setAccessChecked(true));
  }, [needsDoctorAccess, accessToken, patientUserId]);

  useEffect(() => {
    setDetail(null);
    const hit = records.find((r) => r.id === id);
    setLoadState(hit && hasDoctorAccess ? "done" : "loading");
  }, [id, records, hasDoctorAccess]);

  useEffect(() => {
    if (!id || !accessToken) {
      setLoadState("done");
      return;
    }
    if (!hasDoctorAccess) {
      if (accessChecked) setLoadState("done");
      return;
    }

    const cacheOnly =
      cached &&
      (isDoctorView
        ? cached.category === "intake"
        : cached.category === "lab" ||
          cached.category === "xray" ||
          cached.category === "intake" ||
          cached.category === "prescription");

    if (cacheOnly) {
      setLoadState("done");
      return;
    }

    if (!cached) setLoadState("loading");
    setLoadingDetail(true);

    const finish = () => {
      setLoadingDetail(false);
      setLoadState("done");
    };

    if (isDoctorView) {
      if (cached?.category === "prescription" && patientUserId) {
        fetchPrescriptionById(id, patientUserId, accessToken)
          .then((rx) => {
            setDetail(rx);
            upsertPrescription(rx);
          })
          .catch(() => undefined)
          .finally(finish);
        return;
      }

      fetchDoctorDiagnosisById(id, accessToken)
        .then((d) => {
          setDetail(d);
          setEditDesc(d.title);
          upsertDiagnosis(d);
        })
        .catch(async () => {
          if (!patientUserId) return;
          const docs = await fetchDocumentsForPatientUser(patientUserId, accessToken);
          const doc = docs.find((d) => d.id === id);
          if (doc) setDetail(doc);
        })
        .finally(finish);
      return;
    }

    if (cached?.category === "prescription" && profile?.id) {
      fetchPrescriptionById(id, profile.id, accessToken)
        .then((rx) => {
          setDetail(rx);
          upsertPrescription(rx);
        })
        .catch(() => undefined)
        .finally(finish);
      return;
    }

    fetchDiagnosisById(id, accessToken)
      .then((d) => {
        setDetail(d);
        setEditDesc(d.title);
        upsertDiagnosis(d);
      })
      .catch(async () => {
        if (!profile?.id) return;
        const docs = await fetchPatientDocuments(profile.id, accessToken);
        const doc = docs.find((d) => d.id === id);
        if (doc) setDetail(doc);
      })
      .finally(finish);
  }, [
    id,
    accessToken,
    cached?.id,
    cached?.category,
    isDoctorView,
    patientUserId,
    profile?.id,
    upsertDiagnosis,
    upsertPrescription,
    hasDoctorAccess,
    accessChecked,
  ]);

  const permissionCtx = useMemo(
    () => ({
      userId: profile?.id ?? "",
      userRole: role ?? "patient",
      doctorId,
      isDoctorView,
    }),
    [profile?.id, role, doctorId, isDoctorView],
  );

  const derived = useMemo(() => {
    if (!record) {
      return {
        meta: null,
        label: "",
        color: "#3057F2",
        Icon: MEDICAL_RECORD_CATEGORY_META.intake.Icon,
        canEditDiagnosis: false,
        canAddSymptom: false,
        canDeleteRecord: false,
        isDiagnosis: false,
        isPrescription: false,
        isLabOrXray: false,
        isDocImage: false,
      };
    }

    const meta = MEDICAL_RECORD_CATEGORY_META[record.category];
    const isDiagnosis = record.category === "diagnosis";
    const isPrescription = record.category === "prescription";
    const isLabOrXray = record.category === "lab" || record.category === "xray";
    const isDocImage =
      !!record.fileUrl &&
      (IMAGE_EXTS.test(record.fileUrl) || IMAGE_EXTS.test(record.fileName ?? ""));

    return {
      meta,
      label: isRTL ? meta.labelAr : meta.labelEn,
      color: meta.color,
      Icon: meta.Icon,
      canEditDiagnosis: canEditDiagnosis(record, permissionCtx),
      canAddSymptom: canAddDiagnosisSymptom(record, permissionCtx),
      canDeleteRecord: canDeleteMedicalRecord(record, permissionCtx),
      isDiagnosis,
      isPrescription,
      isLabOrXray,
      isDocImage,
    };
  }, [record, isRTL, permissionCtx]);

  const refetchListsAfterChange = async () => {
    if (!accessToken || !profile) return;
    if (isDoctorView && patientUserId) {
      notifyMedicalHistoryChanged(patientUserId);
      return;
    }
    const apiRecords = await fetchAllMedicalHistory(profile.id, accessToken);
    setRecordsFromApi(apiRecords, profile.id);
  };

  const saveDiagnosisEdit = async () => {
    const text = editDesc.trim();
    if (!text || !id || !accessToken || !record || !derived.canEditDiagnosis) return;
    setSavingDiagnosis(true);
    try {
      const updated = await updateDiagnosis(id, { desc: text }, accessToken);
      setDetail(updated);
      upsertDiagnosis(updated);
      setEditingDiagnosis(false);
      await refetchListsAfterChange();
    } catch (e) {
      Alert.alert(isRTL ? "فشل الحفظ" : "Save failed", (e as Error).message);
    } finally {
      setSavingDiagnosis(false);
    }
  };

  const submitSymptom = async () => {
    const text = newSymptom.trim();
    if (!text || !id || !accessToken || !record || !derived.canAddSymptom) return;
    setAddingSymptom(true);
    try {
      const updated = await addSymptomToDiagnosis(id, text, accessToken);
      setDetail(updated);
      upsertDiagnosis(updated);
      setNewSymptom("");
      await refetchListsAfterChange();
    } catch (e) {
      Alert.alert(isRTL ? "فشل الحفظ" : "Save failed", (e as Error).message);
    } finally {
      setAddingSymptom(false);
    }
  };

  const confirmDelete = () => {
    if (!record || !derived.canDeleteRecord || !profile) return;
    Alert.alert(
      isRTL ? "حذف السجل" : "Delete record",
      isRTL ? `حذف "${record.title}"؟` : `Delete "${record.title}"?`,
      [
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: isRTL ? "حذف" : "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                if (
                  (record.category === "lab" || record.category === "xray") &&
                  accessToken
                ) {
                  await deletePatientMedicalDocument(record.id, accessToken);
                  await refetchListsAfterChange();
                }
                remove(profile.id, record.id);
                router.back();
              } catch (e) {
                Alert.alert(
                  isRTL ? "فشل الحذف" : "Delete failed",
                  (e as Error).message,
                );
              }
            })();
          },
        },
      ],
    );
  };

  const openLinkedDoc = (docId: string) => {
    if (isDoctorView && patientUserId) {
      router.push({
        pathname: "/medical/[id]",
        params: { id: docId, doctorView: "1", patientUserId },
      });
    } else {
      router.push(`/medical/${docId}`);
    }
  };

  return {
    id,
    profile,
    accessToken,
    isDoctorView,
    patientUserId,
    needsDoctorAccess,
    hasDoctorAccess,
    accessChecked,
    record,
    loadState,
    loadingDetail,
    newSymptom,
    setNewSymptom,
    addingSymptom,
    editDesc,
    setEditDesc,
    editingDiagnosis,
    setEditingDiagnosis,
    savingDiagnosis,
    zoomImageUri,
    setZoomImageUri,
    ...derived,
    saveDiagnosisEdit,
    submitSymptom,
    confirmDelete,
    openLinkedDoc,
    goBack: () => router.back(),
  };
}
