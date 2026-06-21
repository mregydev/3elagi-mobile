import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@/domains/auth/store";
import {
  createDiagnosis,
  createDoctorMedicalDocument,
  createPatientMedicalDocument,
  fetchAllMedicalHistory,
  fetchDocumentsForPatientUser,
  uploadFile,
} from "@/domains/medical/api";
import { useMedicalStore } from "@/domains/medical/store";
import type { MedicalCategory, MedicalRecord } from "@/domains/medical/types";
import { useI18n } from "@/hooks/useI18n";
import { getAddMedicalCategories } from "@/components/records/medicalRecordCategories";

const ATTACHMENT_CATEGORIES: MedicalCategory[] = ["lab", "xray"];

export interface AttachedFile {
  uri: string;
  name: string;
  mimeType: string;
}

export function useMedicalAddForm() {
  const { isRTL } = useI18n();
  const { category: categoryParam, patientUserId: patientUserIdParam } =
    useLocalSearchParams<{ category?: MedicalCategory; patientUserId?: string }>();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const doctorId = useAuthStore((s) => s.doctorId);
  const add = useMedicalStore((s) => s.add);
  const setRecordsFromApi = useMedicalStore((s) => s.setRecordsFromApi);
  const notifyMedicalHistoryChanged = useMedicalStore((s) => s.notifyMedicalHistoryChanged);
  const isDoctor = role?.toLowerCase() === "doctor";
  const selectedPatientUserId = patientUserIdParam?.trim() ?? "";
  const canAddDiagnosis = isDoctor && !!selectedPatientUserId;
  const availableCategories = getAddMedicalCategories(canAddDiagnosis).map((c) => c.key);

  const resolveDefaultCategory = (): MedicalCategory => {
    if (categoryParam && availableCategories.includes(categoryParam as MedicalCategory)) {
      return categoryParam as MedicalCategory;
    }
    return canAddDiagnosis ? "diagnosis" : "lab";
  };

  const [category, setCategory] = useState<MedicalCategory>(resolveDefaultCategory);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [symptomLines, setSymptomLines] = useState<string[]>([""]);
  const [attached, setAttached] = useState<AttachedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [linkableDocs, setLinkableDocs] = useState<MedicalRecord[]>([]);
  const [loadingLinkable, setLoadingLinkable] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const isDiagnosis = category === "diagnosis";
  const isLabOrXray = category === "lab" || category === "xray";
  const isImage = attached?.mimeType.startsWith("image/") ?? false;
  const linkPatientId = isDoctor && selectedPatientUserId ? selectedPatientUserId : profile?.id;
  const hasCategoryParam =
    !!categoryParam && availableCategories.includes(categoryParam as MedicalCategory);

  useEffect(() => {
    if (!isDiagnosis || !accessToken || !linkPatientId) {
      setLinkableDocs([]);
      setSelectedDocumentIds([]);
      return;
    }
    let cancelled = false;
    setLoadingLinkable(true);
    const load =
      isDoctor && selectedPatientUserId
        ? fetchDocumentsForPatientUser(selectedPatientUserId, accessToken)
        : fetchAllMedicalHistory(linkPatientId, accessToken, role ?? undefined).then((all) =>
            all.filter((r) => r.category === "lab" || r.category === "xray"),
          );
    Promise.resolve(load)
      .then((docs) => {
        if (cancelled) return;
        setLinkableDocs(docs.filter((d) => !d.diagnosisId));
      })
      .catch(() => {
        if (!cancelled) setLinkableDocs([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingLinkable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isDiagnosis, accessToken, linkPatientId, isDoctor, selectedPatientUserId, role]);

  const toggleDocumentLink = (docId: string) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId],
    );
  };

  const handleCategoryChange = (key: MedicalCategory) => {
    setCategory(key);
    if (!ATTACHMENT_CATEGORIES.includes(key)) setAttached(null);
  };

  const addSymptomLine = () => setSymptomLines((prev) => [...prev, ""]);
  const updateSymptomLine = (index: number, text: string) =>
    setSymptomLines((prev) => prev.map((s, i) => (i === index ? text : s)));
  const removeSymptomLine = (index: number) =>
    setSymptomLines((prev) => (prev.length <= 1 ? [""] : prev.filter((_, i) => i !== index)));

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow camera access to scan documents.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setAttached({
        uri: asset.uri,
        name: asset.fileName ?? `scan-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setAttached({
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
    }
  };

  const pickFromFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setAttached({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
      });
    }
  };

  const refetchMedicalHistory = async (ownerId: string) => {
    if (!accessToken) return;
    if (isDoctor && selectedPatientUserId && ownerId === selectedPatientUserId) {
      notifyMedicalHistoryChanged(ownerId);
      return;
    }
    const apiRecords = await fetchAllMedicalHistory(ownerId, accessToken, role ?? undefined);
    setRecordsFromApi(apiRecords, ownerId);
  };

  const submit = async () => {
    if (!profile || !accessToken) {
      Alert.alert("Sign in first");
      return;
    }
    if (isDiagnosis) {
      if (!canAddDiagnosis || !doctorId) {
        Alert.alert(
          isRTL ? "غير مسموح" : "Not allowed",
          isRTL
            ? "التشخيص يضيفه الطبيب فقط. يرجى مراجعة طبيبك."
            : "Only a doctor can add a diagnosis. Please consult your doctor.",
        );
        return;
      }
      if (!title.trim()) {
        Alert.alert(
          isRTL ? "الوصف مطلوب" : "Description required",
          isRTL ? "أدخل وصف التشخيص." : "Enter a diagnosis description.",
        );
        return;
      }
      const symptoms = symptomLines.map((s) => s.trim()).filter(Boolean);
      const documentIds = selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined;
      setUploading(true);
      try {
        await createDiagnosis(
          {
            desc: title.trim(),
            patient_id: selectedPatientUserId,
            doctor_id: doctorId,
            symptoms: symptoms.map((desc) => ({ desc })),
            document_ids: documentIds,
          },
          accessToken,
        );
        await refetchMedicalHistory(selectedPatientUserId);
        setUploading(false);
        router.back();
      } catch (e) {
        setUploading(false);
        Alert.alert(isRTL ? "فشل الحفظ" : "Save failed", (e as Error).message);
      }
      return;
    }

    if (isLabOrXray) {
      if (!title.trim()) {
        Alert.alert(
          isRTL ? "العنوان مطلوب" : "Title required",
          isRTL ? "أدخل عنوانًا لهذا السجل." : "Please enter a title for this record.",
        );
        return;
      }
      if (!notes.trim()) {
        Alert.alert(
          isRTL ? "الوصف مطلوب" : "Description required",
          isRTL ? "أدخل وصفًا لهذا السجل." : "Please enter a description for this record.",
        );
        return;
      }
      if (!attached) {
        Alert.alert(
          isRTL ? "الصورة مطلوبة" : "Image required",
          isRTL ? "التقط صورة أو اختر واحدة من المعرض." : "Take a photo or choose one from your gallery.",
        );
        return;
      }
      if (isDoctor && !selectedPatientUserId) {
        Alert.alert(
          isRTL ? "المريض مطلوب" : "Patient required",
          isRTL
            ? "افتح هذا النموذج من سجل مريض لإضافة هذا المستند."
            : "Open this form from a patient's medical record to add this document.",
        );
        return;
      }
      setUploading(true);
      try {
        const uploaded = await uploadFile(
          attached.uri,
          attached.mimeType,
          attached.name,
          accessToken,
        );
        const fileName =
          uploaded.objectPath.split("/").pop() ??
          attached.name ??
          `upload-${Date.now()}.jpg`;
        const docPayload = {
          type: category as "lab" | "xray",
          file_url: uploaded.url,
          file_name: fileName,
          notes: notes.trim(),
          title: title.trim(),
        };
        if (isDoctor && selectedPatientUserId) {
          await createDoctorMedicalDocument(
            { ...docPayload, patient_id: selectedPatientUserId },
            accessToken,
          );
          await refetchMedicalHistory(selectedPatientUserId);
        } else {
          await createPatientMedicalDocument(docPayload, accessToken);
          await refetchMedicalHistory(profile.id);
        }
        setUploading(false);
        router.back();
      } catch (e) {
        setUploading(false);
        Alert.alert(isRTL ? "فشل الحفظ" : "Save failed", (e as Error).message);
      }
      return;
    }

    if (!title.trim()) {
      Alert.alert(isRTL ? "العنوان مطلوب" : "Title required");
      return;
    }

    add({
      ownerId: profile.id,
      category,
      title: title.trim(),
      value: value.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    router.back();
  };

  const pageTitle = isDiagnosis
    ? isRTL
      ? "إضافة تشخيص"
      : "Add diagnosis"
    : isLabOrXray
      ? category === "lab"
        ? isRTL
          ? "إضافة نتيجة مختبر"
          : "Add lab result"
        : isRTL
          ? "إضافة أشعة"
          : "Add X-ray"
      : isRTL
        ? "إضافة للسجل"
        : "Add to history";

  const pageSubtitle = isDiagnosis
    ? isRTL
      ? "أدخل التشخيص والأعراض واربط نتائج المختبر أو الأشعة إن وجدت."
      : "Enter the diagnosis, optional symptoms, and link any lab or imaging results."
    : isLabOrXray
      ? isRTL
        ? "أضف العنوان والوصف وارفع صورة النتيجة."
        : "Add a title, description, and upload the result image."
      : isRTL
        ? "أضف معلومات فحص الاستقبال إلى سجلك."
        : "Add intake exam information to your record.";

  return {
    isRTL,
    category,
    setCategory: handleCategoryChange,
    hasCategoryParam,
    title,
    setTitle,
    value,
    setValue,
    notes,
    setNotes,
    symptomLines,
    addSymptomLine,
    updateSymptomLine,
    removeSymptomLine,
    attached,
    setAttached,
    uploading,
    zoomVisible,
    setZoomVisible,
    linkableDocs,
    loadingLinkable,
    selectedDocumentIds,
    toggleDocumentLink,
    isDiagnosis,
    isLabOrXray,
    isImage,
    pickFromCamera,
    pickFromGallery,
    pickFromFiles,
    submit,
    pageTitle,
    pageSubtitle,
    goBack: () => router.back(),
  };
}
