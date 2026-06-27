import { router, useLocalSearchParams } from "expo-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Beaker,
  Calendar,
  ClipboardList,
  FileText,
  Hash,
  Pill,
  ScanLine,
  Trash2,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { FullscreenImageViewer } from "@/components/FullscreenImageViewer";
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
import { DoctorPatientAccessDenied } from "@/components/DoctorPatientAccessDenied";
import { useMedicalStore } from "@/domains/medical/store";
import type { MedicalCategory, MedicalRecord } from "@/domains/medical/types";
import {
  canAddDiagnosisSymptom,
  canDeleteMedicalRecord,
  canEditDiagnosis,
} from "@/domains/medical/permissions";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { alignText, flexRow, localeTag } from "@/utils/rtl";

const CATEGORY_META: Record<
  MedicalCategory,
  { labelEn: string; labelAr: string; Icon: typeof Activity; color: string }
> = {
  diagnosis: { labelEn: "Diagnosis",   labelAr: "التشخيص",       Icon: Activity,     color: "#ef4444" },
  lab:     { labelEn: "Lab Result",  labelAr: "نتائج المختبر",  Icon: Beaker,       color: "#10b981" },
  xray:    { labelEn: "X-ray / Scan",labelAr: "الأشعة والمسح", Icon: ScanLine,     color: "#8b5cf6" },
  prescription: { labelEn: "Prescription", labelAr: "روشتة", Icon: Pill, color: "#f59e0b" },
  intake:  { labelEn: "Intake Exam", labelAr: "فحص الاستقبال", Icon: ClipboardList, color: "#3057F2" },
};

export default function MedicalRecordDetail() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();
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

  const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|heic)(\?.*)?$/i;

  const needsDoctorAccess = isDoctorView && !!patientUserId;
  const hasDoctorAccess =
    !needsDoctorAccess || canDoctorViewPatientRecords(accessStatus);

  const cached = records.find((r) => r.id === id);
  const record = hasDoctorAccess ? detail ?? cached : null;
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);

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

  if (needsDoctorAccess && !accessChecked) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.loadingBack} hitSlop={10}>
          {isRTL ? (
            <ArrowRight size={22} color={colors.primary} />
          ) : (
            <ArrowLeft size={22} color={colors.primary} />
          )}
        </Pressable>
        <View style={styles.loadingBody}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (needsDoctorAccess && !hasDoctorAccess) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={[styles.loadingBack, { alignSelf: "flex-start", marginLeft: 12 }]} hitSlop={10}>
          {isRTL ? (
            <ArrowRight size={22} color={colors.primary} />
          ) : (
            <ArrowLeft size={22} color={colors.primary} />
          )}
        </Pressable>
        <DoctorPatientAccessDenied isRTL={isRTL} />
      </View>
    );
  }

  if (!record && loadState === "loading") {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.loadingBack} hitSlop={10}>
          {isRTL ? (
            <ArrowRight size={22} color={colors.primary} />
          ) : (
            <ArrowLeft size={22} color={colors.primary} />
          )}
        </Pressable>
        <View style={styles.loadingBody}>
          <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 14, textAlign }}>
          {isRTL ? "جاري التحميل…" : "Loading record…"}
        </Text>
        </View>
      </View>
    );
  }

  if (!record) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, textAlign }}>
          {isRTL ? "السجل غير موجود" : "Record not found"}
        </Text>
      </View>
    );
  }

  const meta  = CATEGORY_META[record.category];
  const { Icon, color } = meta;
  const label = isRTL ? meta.labelAr : meta.labelEn;

  const permissionCtx = {
    userId: profile?.id ?? "",
    userRole: role ?? "patient",
    doctorId,
    isDoctorView,
  };
  const canEditDiagnosisRecord = canEditDiagnosis(record, permissionCtx);
  const canAddSymptom = canAddDiagnosisSymptom(record, permissionCtx);
  const canDeleteRecord = canDeleteMedicalRecord(record, permissionCtx);
  const isDiagnosis = record.category === "diagnosis";
  const isPrescription = record.category === "prescription";
  const isLabOrXray = record.category === "lab" || record.category === "xray";
  const isDocImage =
    !!record.fileUrl &&
    (IMAGE_EXTS.test(record.fileUrl) || IMAGE_EXTS.test(record.fileName ?? ""));

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
    if (!text || !id || !accessToken || !canEditDiagnosisRecord) return;
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
    if (!text || !id || !accessToken || !canAddSymptom) return;
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
    if (!canDeleteRecord) return;
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
                remove(profile!.id, record.id);
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 6,
            backgroundColor: color,
            flexDirection: dir,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={10}>
          {isRTL
            ? <ArrowRight size={22} color="#fff" />
            : <ArrowLeft  size={22} color="#fff" />}
        </Pressable>

        {/* Category chip */}
        <View style={[styles.categoryChip, { flexDirection: dir }]}>
          <Icon size={15} color="#fff" />
          <Text style={styles.categoryChipText}>{label}</Text>
        </View>

        {canDeleteRecord ? (
          <Pressable onPress={confirmDelete} style={styles.headerBtn} hitSlop={10}>
            <Trash2 size={20} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      {/* ── Title band ── */}
      <View style={[styles.titleBand, { backgroundColor: color + "18", borderBottomColor: color + "30" }]}>
        <View style={[styles.titleRow, { flexDirection: dir }]}>
          <View style={[styles.titleIcon, { backgroundColor: color + "25" }]}>
            <Icon size={22} color={color} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={[styles.title, { color: colors.foreground, textAlign }]}
            >
              {isDiagnosis && editingDiagnosis && canEditDiagnosisRecord
                ? editDesc || record.title
                : record.title}
            </Text>
            {isDiagnosis && record.doctorName ? (
              <Text
                style={[
                  styles.doctorName,
                  { color: colors.mutedForeground, textAlign },
                ]}
              >
                {isRTL ? `د. ${record.doctorName}` : `Dr. ${record.doctorName}`}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── Detail cards ── */}
      <KeyboardSafeScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: Math.max(56 + insets.bottom, 140) },
        ]}
      >

        {(isLabOrXray || isPrescription) && record.fileUrl && isDocImage && (
          <Pressable
            onPress={() => setZoomImageUri(record.fileUrl!)}
            style={[styles.imageCard, { borderColor: colors.border }]}
          >
            <Image source={{ uri: record.fileUrl }} style={styles.detailImage} resizeMode="cover" />
          </Pressable>
        )}

        {(isLabOrXray || isPrescription) && record.fileUrl && !isDocImage && (
          <Pressable
            onPress={() => Linking.openURL(record.fileUrl!)}
            style={[styles.fileLinkCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <FileText size={32} color={color} />
            <Text style={{ color: colors.primary, fontWeight: "600", textAlign }}>
              {isRTL ? "فتح الملف" : "Open attached file"}
            </Text>
          </Pressable>
        )}

        {record.value ? (
          <DetailCard
            icon={<Hash size={18} color={color} />}
            label={isRTL ? "القيمة" : "Value"}
            value={record.value}
            color={color}
            colors={colors}
            isRTL={isRTL}
          />
        ) : null}

        {record.notes ? (
          <DetailCard
            icon={<FileText size={18} color={color} />}
            label={isRTL ? "الوصف" : isLabOrXray ? "Description" : "Notes"}
            value={record.notes}
            color={color}
            colors={colors}
            isRTL={isRTL}
          />
        ) : null}

        {canEditDiagnosisRecord && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground, textAlign }]}>
              {isRTL ? "تعديل التشخيص" : "Edit diagnosis"}
            </Text>
            {editingDiagnosis ? (
              <View style={{ gap: 10 }}>
                <TextInput
                  value={editDesc}
                  onChangeText={setEditDesc}
                  multiline
                  placeholder={isRTL ? "وصف التشخيص…" : "Diagnosis description…"}
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    styles.titleInput,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      textAlign,
                    },
                  ]}
                />
                <Pressable
                  onPress={saveDiagnosisEdit}
                  disabled={savingDiagnosis || !editDesc.trim()}
                  style={[
                    styles.addSymptomBtn,
                    {
                      backgroundColor: editDesc.trim() ? color : colors.muted,
                      opacity: savingDiagnosis ? 0.6 : 1,
                      alignSelf: "flex-start",
                    },
                  ]}
                >
                  {savingDiagnosis ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.addSymptomBtnText}>{isRTL ? "حفظ" : "Save"}</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => { setEditingDiagnosis(false); setEditDesc(record.title); }}>
                  <Text style={{ color: colors.mutedForeground, fontWeight: "600" }}>
                    {isRTL ? "إلغاء" : "Cancel"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setEditingDiagnosis(true)}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>
                  {isRTL ? "تعديل الوصف" : "Edit description"}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {isLabOrXray && record.linkedDiagnoses && record.linkedDiagnoses.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.cardHeader, { flexDirection: dir }]}>
              <View style={[styles.cardIconWrap, { backgroundColor: "#ef444418" }]}>
                <Activity size={18} color="#ef4444" />
              </View>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground, textAlign }]}>
                {isRTL ? "تشخيصات مرتبطة" : "Linked diagnoses"}
              </Text>
            </View>
            {record.linkedDiagnoses.map((diag) => (
              <Pressable
                key={diag.id}
                onPress={() => {
                  if (isDoctorView && patientUserId) {
                    router.push({
                      pathname: "/medical/[id]",
                      params: {
                        id: diag.id,
                        doctorView: "1",
                        patientUserId,
                      },
                    });
                  } else {
                    router.push(`/medical/${diag.id}`);
                  }
                }}
                style={[
                  styles.linkedDocRow,
                  { borderColor: colors.border, flexDirection: dir },
                ]}
              >
                <View
                  style={[
                    styles.linkedThumb,
                    styles.linkedThumbPlaceholder,
                    { backgroundColor: "#ef444422" },
                  ]}
                >
                  <Activity size={22} color="#ef4444" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{ color: colors.foreground, fontWeight: "700", textAlign }}
                    numberOfLines={3}
                  >
                    {diag.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {isDiagnosis && record.linkedDocuments && record.linkedDocuments.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.cardHeader, { flexDirection: dir }]}>
              <View style={[styles.cardIconWrap, { backgroundColor: "#10b98118" }]}>
                <Beaker size={18} color="#10b981" />
              </View>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground, textAlign }]}>
                {isRTL ? "نتائج مرتبطة" : "Linked results"}
              </Text>
            </View>
            {record.linkedDocuments.map((doc) => {
              const docMeta = CATEGORY_META[doc.category];
              const docIsImage =
                !!doc.fileUrl &&
                (IMAGE_EXTS.test(doc.fileUrl) || IMAGE_EXTS.test(doc.fileName ?? ""));
              return (
                <Pressable
                  key={doc.id}
                  onPress={() => {
                    if (isDoctorView && patientUserId) {
                      router.push({
                        pathname: "/medical/[id]",
                        params: {
                          id: doc.id,
                          doctorView: "1",
                          patientUserId,
                        },
                      });
                    } else {
                      router.push(`/medical/${doc.id}`);
                    }
                  }}
                  style={[
                    styles.linkedDocRow,
                    { borderColor: colors.border, flexDirection: dir },
                  ]}
                >
                  {docIsImage && doc.fileUrl ? (
                    <Image
                      source={{ uri: doc.fileUrl }}
                      style={styles.linkedThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.linkedThumb,
                        styles.linkedThumbPlaceholder,
                        { backgroundColor: docMeta.color + "22" },
                      ]}
                    >
                      <docMeta.Icon size={22} color={docMeta.color} />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{ color: colors.foreground, fontWeight: "700", textAlign }}
                      numberOfLines={2}
                    >
                      {doc.title}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign }}>
                      {isRTL ? docMeta.labelAr : docMeta.labelEn}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : isDiagnosis && !loadingDetail ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign }}>
              {isRTL ? "لا توجد نتائج مختبر أو أشعة مرتبطة" : "No linked lab results or X-rays"}
            </Text>
          </View>
        ) : null}

        {record.category === "diagnosis" && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.cardHeader, { flexDirection: dir }]}>
              <View style={[styles.cardIconWrap, { backgroundColor: color + "18" }]}>
                <Activity size={18} color={color} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground, textAlign }]}>
                {isRTL ? "الأعراض" : "Symptoms"}
              </Text>
            </View>
            {loadingDetail ? (
              <ActivityIndicator color={color} style={{ marginVertical: 8 }} />
            ) : record.symptoms?.length ? (
              record.symptoms.map((s) => (
                <Text
                  key={s.id}
                  style={[
                    styles.symptomLine,
                    { color: colors.foreground, textAlign },
                  ]}
                >
                  • {s.desc}
                </Text>
              ))
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
                {isRTL ? "لا توجد أعراض مسجلة" : "No symptoms recorded"}
              </Text>
            )}
            {canAddSymptom && (
              <View style={[styles.addSymptomRow, { flexDirection: dir }]}>
                <TextInput
                  value={newSymptom}
                  onChangeText={setNewSymptom}
                  placeholder={isRTL ? "عرض جديد…" : "New symptom…"}
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    styles.addSymptomInput,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                      color: colors.foreground,
                      textAlign,
                    },
                  ]}
                  onSubmitEditing={submitSymptom}
                />
                <Pressable
                  onPress={submitSymptom}
                  disabled={addingSymptom || !newSymptom.trim()}
                  style={[
                    styles.addSymptomBtn,
                    {
                      backgroundColor: newSymptom.trim() ? color : colors.muted,
                      opacity: addingSymptom ? 0.6 : 1,
                    },
                  ]}
                >
                  {addingSymptom ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.addSymptomBtnText}>{isRTL ? "إضافة" : "Add"}</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        )}

        {isPrescription ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.cardHeader, { flexDirection: dir }]}>
              <View style={[styles.cardIconWrap, { backgroundColor: color + "18" }]}>
                <Pill size={18} color={color} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground, textAlign }]}>
                {isRTL ? "الأدوية" : "Medications"}
              </Text>
            </View>
            {loadingDetail ? (
              <ActivityIndicator color={color} style={{ marginVertical: 8 }} />
            ) : record.medications?.length ? (
              record.medications.map((med, index) => (
                <View
                  key={med.id ?? `med-${index}`}
                  style={[styles.medRow, { borderColor: colors.border, backgroundColor: colors.muted }]}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "700", textAlign }}>
                    {med.medication_name}
                  </Text>
                  {med.dose ? (
                    <Text style={{ color: colors.mutedForeground, fontSize: 13, textAlign }}>
                      {isRTL ? "الجرعة: " : "Dose: "}
                      {med.dose}
                    </Text>
                  ) : null}
                  {med.interval ? (
                    <Text style={{ color: colors.mutedForeground, fontSize: 13, textAlign }}>
                      {isRTL ? "التكرار: " : "Interval: "}
                      {med.interval}
                    </Text>
                  ) : null}
                  {med.notes ? (
                    <Text style={{ color: colors.foreground, fontSize: 13, textAlign, marginTop: 4 }}>
                      {med.notes}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign }}>
                {isRTL ? "لا توجد أدوية مسجلة" : "No medications recorded"}
              </Text>
            )}
          </View>
        ) : null}

        <DetailCard
          icon={<Calendar size={18} color={color} />}
          label={isRTL ? "التاريخ" : "Date"}
          value={new Date(record.date).toLocaleDateString(localeTag(isRTL), {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          color={color}
          colors={colors}
          isRTL={isRTL}
        />

        {/* Meta info row */}
        <View
          style={[
            styles.metaRow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              flexDirection: dir,
            },
          ]}
        >
          <Text style={[styles.metaLabel, { color: colors.mutedForeground, textAlign }]}>
            {isRTL ? "أُضيف في:" : "Added:"}
          </Text>
          <Text style={[styles.metaValue, { color: colors.foreground, textAlign }]}>
            {new Date(record.createdAt).toLocaleString(localeTag(isRTL), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Text>
        </View>

        {canDeleteRecord && (
          <Pressable
            onPress={confirmDelete}
            style={[styles.deleteBtn, { borderColor: "#ef4444", flexDirection: dir }]}
          >
            <Trash2 size={16} color="#ef4444" />
            <Text style={styles.deleteBtnText}>
              {isRTL ? "حذف هذا السجل" : "Delete this record"}
            </Text>
          </Pressable>
        )}
      </KeyboardSafeScrollView>

      <FullscreenImageViewer
        uri={zoomImageUri}
        onClose={() => setZoomImageUri(null)}
      />
    </View>
  );
}

// ─── Detail card ─────────────────────────────────────────────────────────────

function DetailCard({
  icon,
  label,
  value,
  color,
  colors,
  isRTL,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
}) {
  const dir = isRTL ? "row-reverse" : "row";
  const textAlign = alignText(isRTL);
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.cardHeader, { flexDirection: dir }]}>
        <View style={[styles.cardIconWrap, { backgroundColor: color + "18" }]}>
          {icon}
        </View>
        <Text style={[styles.cardLabel, { color: colors.mutedForeground, textAlign }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.cardValue,
          { color: colors.foreground, textAlign },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingRoot: { flex: 1 },
  loadingBack: { paddingHorizontal: 16, paddingVertical: 12, alignSelf: "flex-start" },
  loadingBody: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 14,
    gap: 8,
  },
  headerBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  categoryChip: {
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryChipText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  titleBand: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  titleRow: { alignItems: "center", gap: 14 },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "800", lineHeight: 28 },
  doctorName: { fontSize: 14, fontWeight: "600" },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
  },

  body: { padding: 16, gap: 12, paddingBottom: 40 },

  imageCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailImage: { width: "100%", height: 220 },
  fileLinkCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeader: { alignItems: "center", gap: 10 },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  cardValue: { fontSize: 15, lineHeight: 22 },
  symptomLine: { fontSize: 15, lineHeight: 24, marginTop: 6 },
  medRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    marginTop: 8,
  },
  linkedDocRow: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  linkedThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  linkedThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  addSymptomRow: { alignItems: "center", gap: 8, marginTop: 12 },
  addSymptomInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  addSymptomBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 64,
    alignItems: "center",
  },
  addSymptomBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metaLabel: { fontSize: 12, fontWeight: "600" },
  metaValue: { fontSize: 13, flex: 1 },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    marginTop: 4,
  },
  deleteBtnText: { color: "#ef4444", fontWeight: "700", fontSize: 14 },
});
