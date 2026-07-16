import { Plus, Sparkles, Stethoscope, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppTextInput } from "@/components/AppTextInput";
import { BodyPartPicker } from "@/components/records/BodyPartPicker";
import {
  fetchIntakeExamsForPatient,
  fetchIntakeTests,
} from "@/domains/intake-exams/api";
import type { IntakeTestTemplate } from "@/domains/intake-exams/types";
import {
  completeDiagnosisWithAi,
  draftAiPrescriptionForDiagnosis,
  fetchDocumentsForPatientUser,
  fetchPrescriptionsForPatientUser,
  type DiagnosisIntakeAttach,
  type DiagnosisPrescriptionAttach,
} from "@/domains/medical/api";
import { parseBodyPart, type BodyPart } from "@/domains/medical/bodyParts";
import type { MedicalRecord, PrescriptionMedication } from "@/domains/medical/types";
import { useApiLang } from "@/hooks/useApiLang";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { showAppAlert } from "@/utils/appAlert";
import { flexRow } from "@/utils/rtl";

export type DiagnosisSubmitPayload = {
  description: string;
  symptoms: string[];
  documentIds: string[];
  note?: string;
  bodyPart: BodyPart;
  prescription_id?: string;
  prescription?: DiagnosisPrescriptionAttach;
  intake_exam_assignment_id?: string;
  intake_exam?: DiagnosisIntakeAttach;
};

type AttachMode = "none" | "existing" | "new";

function emptyMed(): PrescriptionMedication {
  return { medication_name: "", dose: "", interval: "", notes: "" };
}

function defaultDeadlineIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

export interface DiagnosisChatFormProps {
  visible: boolean;
  isRTL: boolean;
  patientUserId: string;
  accessToken: string;
  /** When ending a consult, pass id so AI can use that consultation. */
  consultationId?: string;
  saving?: boolean;
  title?: string;
  submitLabel?: string;
  noteLabel?: string;
  notePlaceholder?: string;
  requireDescription?: boolean;
  onClose: () => void;
  onSubmit: (payload: DiagnosisSubmitPayload) => void;
}

export function DiagnosisChatForm({
  visible,
  isRTL,
  patientUserId,
  accessToken,
  consultationId,
  saving = false,
  title,
  submitLabel,
  noteLabel,
  notePlaceholder,
  requireDescription = true,
  onClose,
  onSubmit,
}: DiagnosisChatFormProps) {
  const colors = useColors();
  const { t } = useI18n();
  const apiLang = useApiLang();
  const dir = flexRow(isRTL);
  const textAlign = isRTL ? "right" : "left";

  const [description, setDescription] = useState("");
  const [symptomLines, setSymptomLines] = useState<string[]>([""]);
  const [note, setNote] = useState("");
  const [bodyPart, setBodyPart] = useState<BodyPart>("general");
  const [linkableDocs, setLinkableDocs] = useState<MedicalRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [completingAi, setCompletingAi] = useState(false);

  const [rxMode, setRxMode] = useState<AttachMode>("none");
  const [existingRx, setExistingRx] = useState<MedicalRecord[]>([]);
  const [selectedRxId, setSelectedRxId] = useState<string | null>(null);
  const [rxTitle, setRxTitle] = useState("");
  const [rxMeds, setRxMeds] = useState<PrescriptionMedication[]>([emptyMed()]);
  const [draftingRx, setDraftingRx] = useState(false);

  const [intakeMode, setIntakeMode] = useState<AttachMode>("none");
  const [intakeTests, setIntakeTests] = useState<IntakeTestTemplate[]>([]);
  const [existingIntakes, setExistingIntakes] = useState<MedicalRecord[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [intakeDeadline, setIntakeDeadline] = useState(defaultDeadlineIso);

  useEffect(() => {
    if (!visible) {
      setDescription("");
      setSymptomLines([""]);
      setNote("");
      setBodyPart("general");
      setSelectedDocumentIds([]);
      setLinkableDocs([]);
      setRxMode("none");
      setSelectedRxId(null);
      setRxTitle("");
      setRxMeds([emptyMed()]);
      setIntakeMode("none");
      setSelectedAssignmentId(null);
      setSelectedTestId(null);
      setIntakeDeadline(defaultDeadlineIso());
      return;
    }

    let cancelled = false;
    setLoadingDocs(true);
    void Promise.all([
      fetchDocumentsForPatientUser(patientUserId, accessToken),
      fetchPrescriptionsForPatientUser(patientUserId, accessToken).catch(() => [] as MedicalRecord[]),
      fetchIntakeExamsForPatient(patientUserId, accessToken).catch(() => [] as MedicalRecord[]),
      fetchIntakeTests(accessToken).catch(() => [] as IntakeTestTemplate[]),
    ])
      .then(([docs, rxs, intakes, tests]) => {
        if (cancelled) return;
        setLinkableDocs(docs.filter((d) => d.category === "lab" || d.category === "xray"));
        setExistingRx(rxs.filter((r) => r.category === "prescription"));
        // Dedupe by assignment id (multiple instances share one assignment).
        const seen = new Set<string>();
        const unique: MedicalRecord[] = [];
        for (const row of intakes) {
          const aid = row.intakeExam?.assignmentId;
          if (!aid || seen.has(aid)) continue;
          seen.add(aid);
          unique.push(row);
        }
        setExistingIntakes(unique);
        setIntakeTests(tests.filter((t) => t.is_active !== false));
      })
      .catch(() => {
        if (!cancelled) {
          setLinkableDocs([]);
          setExistingRx([]);
          setExistingIntakes([]);
          setIntakeTests([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDocs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, patientUserId, accessToken]);

  const toggleDocument = (docId: string) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId],
    );
  };

  const completeWithAi = async () => {
    const desc = description.trim();
    if (!desc || completingAi || saving) return;
    setCompletingAi(true);
    try {
      const result = await completeDiagnosisWithAi(
        { patient_id: patientUserId, desc, lang: apiLang },
        accessToken,
      );
      const symptoms = result.symptoms.map((s) => s.desc).filter(Boolean);
      setSymptomLines(symptoms.length > 0 ? symptoms : [""]);
      setSelectedDocumentIds(result.document_ids ?? []);
      const part = parseBodyPart(result.body_part);
      if (part) setBodyPart(part);
    } catch (err) {
      showAppAlert(
        isRTL ? "فشل الإكمال" : "AI complete failed",
        (err as Error).message,
      );
    } finally {
      setCompletingAi(false);
    }
  };

  const draftPrescriptionAi = async () => {
    const desc = description.trim();
    if (!desc || draftingRx || saving) return;
    setRxMode("new");
    setDraftingRx(true);
    try {
      const draft = await draftAiPrescriptionForDiagnosis(
        {
          patient_user_id: patientUserId,
          diagnosis_title: desc,
          consultation_id: consultationId,
          symptoms: symptomLines.map((s) => s.trim()).filter(Boolean),
          lang: apiLang,
        },
        accessToken,
      );
      setRxTitle(draft.title || desc);
      setRxMeds(
        draft.medications.length
          ? draft.medications.map((m) => ({
              medication_name: m.medication_name,
              dose: m.dose ?? "",
              interval: m.interval ?? "",
              notes: m.notes ?? "",
            }))
          : [emptyMed()],
      );
    } catch (err) {
      showAppAlert(
        isRTL ? "فشل مسودة الروشتة" : "Prescription draft failed",
        (err as Error).message,
      );
    } finally {
      setDraftingRx(false);
    }
  };

  const updateMed = (index: number, patch: Partial<PrescriptionMedication>) => {
    setRxMeds((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const modeChip = (
    label: string,
    active: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      onPress={onPress}
      disabled={saving}
      style={[
        styles.modeChip,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? `${colors.primary}14` : colors.muted,
        },
      ]}
    >
      <Text
        style={{
          color: active ? colors.primary : colors.foreground,
          fontWeight: "700",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  const submit = () => {
    const desc = description.trim();
    const trimmedNote = note.trim();
    if (saving) return;
    if (requireDescription && !desc) return;
    if (!requireDescription && !desc && !trimmedNote) return;
    const symptoms = symptomLines.map((s) => s.trim()).filter(Boolean);

    let prescription_id: string | undefined;
    let prescription: DiagnosisPrescriptionAttach | undefined;
    if (rxMode === "existing") {
      if (!selectedRxId) {
        showAppAlert(
          isRTL ? "روشتة مطلوبة" : "Prescription required",
          isRTL ? "اختر روشتة موجودة." : "Select an existing prescription.",
        );
        return;
      }
      prescription_id = selectedRxId;
    } else if (rxMode === "new") {
      const medications = rxMeds
        .map((m) => ({
          medication_name: m.medication_name.trim(),
          dose: m.dose?.trim() || undefined,
          interval: m.interval?.trim() || undefined,
          notes: m.notes?.trim() || undefined,
        }))
        .filter((m) => m.medication_name.length > 0);
      if (!medications.length) {
        showAppAlert(
          isRTL ? "أدوية مطلوبة" : "Medications required",
          isRTL ? "أضف دواء واحدًا على الأقل." : "Add at least one medication.",
        );
        return;
      }
      prescription = {
        title: rxTitle.trim() || desc,
        symptoms: symptoms.join("; ") || undefined,
        medications,
        body_part: bodyPart,
      };
    }

    let intake_exam_assignment_id: string | undefined;
    let intake_exam: DiagnosisIntakeAttach | undefined;
    if (intakeMode === "existing") {
      if (!selectedAssignmentId) {
        showAppAlert(
          isRTL ? "فحص مطلوب" : "Intake exam required",
          isRTL ? "اختر فحص استقبال موجود." : "Select an existing intake exam.",
        );
        return;
      }
      intake_exam_assignment_id = selectedAssignmentId;
    } else if (intakeMode === "new") {
      if (!selectedTestId) {
        showAppAlert(
          isRTL ? "نموذج مطلوب" : "Template required",
          isRTL ? "اختر نموذج فحص الاستقبال." : "Select an intake exam template.",
        );
        return;
      }
      intake_exam = {
        intake_test_id: selectedTestId,
        deadline_at: intakeDeadline || defaultDeadlineIso(),
        recurrence_type: "none",
      };
    }

    onSubmit({
      description: desc,
      symptoms,
      documentIds: selectedDocumentIds,
      note: trimmedNote || undefined,
      bodyPart,
      prescription_id,
      prescription,
      intake_exam_assignment_id,
      intake_exam,
    });
  };

  const canSubmit =
    !saving &&
    !draftingRx &&
    (requireDescription ? !!description.trim() : !!description.trim() || !!note.trim());

  const uniqueAssignments = useMemo(() => existingIntakes, [existingIntakes]);

  return (
    <ScrollView
      style={Platform.OS === "web" ? styles.webScroll : undefined}
      keyboardShouldPersistTaps="handled"
      bounces={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      <View style={[styles.header, { flexDirection: dir }]}>
        <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
          <Stethoscope size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.foreground,
              fontWeight: "700",
              fontSize: 17,
              textAlign,
            }}
          >
            {title ?? (isRTL ? "إضافة تشخيص" : "Add diagnosis")}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={8} disabled={saving}>
          <X size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <Text style={[styles.label, { color: colors.mutedForeground, textAlign }]}>
        {isRTL ? "وصف التشخيص" : "Diagnosis description"}
        {!requireDescription ? (isRTL ? " (اختياري)" : " (optional)") : null}
      </Text>
      <AppTextInput
        value={description}
        onChangeText={setDescription}
        placeholder={isRTL ? "مثال: التهاب الشعب الهوائية" : "e.g. Acute bronchitis"}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            backgroundColor: colors.muted,
            color: colors.foreground,
            textAlign,
          },
        ]}
        multiline
        maxLength={500}
        editable={!saving && !completingAi}
      />

      <Pressable
        onPress={() => void completeWithAi()}
        disabled={!description.trim() || completingAi || saving}
        style={[
          styles.aiBtn,
          {
            flexDirection: dir,
            borderColor: colors.primary,
            backgroundColor: `${colors.primary}12`,
            opacity: !description.trim() || completingAi || saving ? 0.55 : 1,
          },
        ]}
      >
        {completingAi ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Sparkles size={16} color={colors.primary} />
        )}
        <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 13 }}>
          {t.records.completeWithAi}
        </Text>
      </Pressable>

      <BodyPartPicker value={bodyPart} onChange={setBodyPart} label={t.records.bodyPart} />

      <Text style={[styles.label, { color: colors.mutedForeground, textAlign }]}>
        {isRTL ? "الأعراض (اختياري)" : "Symptoms (optional)"}
      </Text>
      {symptomLines.map((line, index) => (
        <View key={index} style={[styles.symptomRow, { flexDirection: dir }]}>
          <AppTextInput
            value={line}
            onChangeText={(value) => {
              const next = [...symptomLines];
              next[index] = value;
              setSymptomLines(next);
            }}
            placeholder={isRTL ? "عرض" : "Symptom"}
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.symptomInput,
              { backgroundColor: colors.muted, color: colors.foreground, textAlign },
            ]}
            editable={!saving}
          />
          {symptomLines.length > 1 ? (
            <Pressable
              onPress={() => setSymptomLines(symptomLines.filter((_, i) => i !== index))}
              hitSlop={8}
              disabled={saving}
            >
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      ))}
      <Pressable
        onPress={() => setSymptomLines([...symptomLines, ""])}
        style={[styles.addSymptom, { flexDirection: dir }]}
        disabled={saving}
      >
        <Plus size={16} color={colors.primary} />
        <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>
          {isRTL ? "إضافة عرض" : "Add symptom"}
        </Text>
      </Pressable>

      <Text style={[styles.label, { color: colors.mutedForeground, textAlign }]}>
        {isRTL ? "ربط نتائج المختبر / الأشعة (اختياري)" : "Link lab results / X-rays (optional)"}
      </Text>
      {loadingDocs ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
      ) : linkableDocs.length === 0 ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 13, textAlign, marginBottom: 8 }}>
          {isRTL
            ? "لا توجد نتائج مختبر أو أشعة متاحة."
            : "No lab results or X-rays available."}
        </Text>
      ) : (
        <View style={{ gap: 8, marginBottom: 8 }}>
          {linkableDocs.map((doc) => {
            const selected = selectedDocumentIds.includes(doc.id);
            const catLabel =
              doc.category === "lab"
                ? isRTL
                  ? "مختبر"
                  : "Lab"
                : isRTL
                  ? "أشعة"
                  : "X-ray";
            return (
              <Pressable
                key={doc.id}
                onPress={() => toggleDocument(doc.id)}
                disabled={saving}
                style={[
                  styles.linkRow,
                  {
                    flexDirection: dir,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? `${colors.primary}12` : colors.muted,
                  },
                ]}
              >
                <View
                  style={[
                    styles.linkCheck,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {selected ? (
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>✓</Text>
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "600", textAlign }}>
                    {catLabel}
                  </Text>
                  <Text style={{ color: colors.foreground, fontWeight: "600", textAlign }} numberOfLines={2}>
                    {doc.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Prescription attach */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}>
        {isRTL ? "روشتة (اختياري)" : "Prescription (optional)"}
      </Text>
      <Text style={[styles.hint, { color: colors.mutedForeground, textAlign }]}>
        {isRTL
          ? "اربط روشتة موجودة أو أنشئ واحدة — ويمكن طلب مسودة بالذكاء الاصطناعي من أدوية بلد المريض فقط للمراجعة."
          : "Attach an existing Rx or create one — optional AI draft uses meds available in the patient's country for your review."}
      </Text>
      <View style={[styles.modeRow, { flexDirection: dir }]}>
        {modeChip(isRTL ? "بدون" : "None", rxMode === "none", () => setRxMode("none"))}
        {modeChip(isRTL ? "موجودة" : "Existing", rxMode === "existing", () => setRxMode("existing"))}
        {modeChip(isRTL ? "جديدة" : "New", rxMode === "new", () => setRxMode("new"))}
      </View>

      {rxMode === "existing" ? (
        existingRx.length === 0 ? (
          <Text style={{ color: colors.mutedForeground, fontSize: 13, textAlign }}>
            {isRTL ? "لا توجد روشتات سابقة." : "No previous prescriptions."}
          </Text>
        ) : (
          <View style={{ gap: 8, marginBottom: 8 }}>
            {existingRx.map((rx) => {
              const selected = selectedRxId === rx.id;
              return (
                <Pressable
                  key={rx.id}
                  onPress={() => setSelectedRxId(rx.id)}
                  style={[
                    styles.linkRow,
                    {
                      flexDirection: dir,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? `${colors.primary}12` : colors.muted,
                    },
                  ]}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "600", flex: 1, textAlign }}>
                    {rx.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )
      ) : null}

      {rxMode === "new" ? (
        <View style={{ gap: 8, marginBottom: 8 }}>
          <Pressable
            onPress={() => void draftPrescriptionAi()}
            disabled={!description.trim() || draftingRx || saving}
            style={[
              styles.aiBtn,
              {
                flexDirection: dir,
                borderColor: colors.primary,
                backgroundColor: `${colors.primary}12`,
                opacity: !description.trim() || draftingRx || saving ? 0.55 : 1,
              },
            ]}
          >
            {draftingRx ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Sparkles size={16} color={colors.primary} />
            )}
            <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 13 }}>
              {isRTL
                ? "مسودة روشتة بالذكاء الاصطناعي (حسب بلد المريض)"
                : "AI draft prescription (patient country meds)"}
            </Text>
          </Pressable>
          <AppTextInput
            value={rxTitle}
            onChangeText={setRxTitle}
            placeholder={isRTL ? "عنوان الروشتة" : "Prescription title"}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, textAlign }]}
            editable={!saving}
          />
          {rxMeds.map((med, index) => (
            <View
              key={`rx-med-${index}`}
              style={[styles.medCard, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <View style={[styles.medHead, { flexDirection: dir }]}>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                  {isRTL ? `دواء ${index + 1}` : `Medication ${index + 1}`}
                </Text>
                {rxMeds.length > 1 ? (
                  <Pressable onPress={() => setRxMeds((rows) => rows.filter((_, i) => i !== index))}>
                    <X size={16} color={colors.destructive} />
                  </Pressable>
                ) : null}
              </View>
              <AppTextInput
                value={med.medication_name}
                onChangeText={(v) => updateMed(index, { medication_name: v })}
                placeholder={isRTL ? "اسم الدواء" : "Medication name"}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, textAlign }]}
              />
              <AppTextInput
                value={med.dose ?? ""}
                onChangeText={(v) => updateMed(index, { dose: v })}
                placeholder={isRTL ? "الجرعة" : "Dose"}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, textAlign }]}
              />
              <AppTextInput
                value={med.interval ?? ""}
                onChangeText={(v) => updateMed(index, { interval: v })}
                placeholder={isRTL ? "التكرار" : "Interval"}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, textAlign }]}
              />
            </View>
          ))}
          <Pressable
            onPress={() => setRxMeds((rows) => [...rows, emptyMed()])}
            style={[styles.addSymptom, { flexDirection: dir }]}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>
              {isRTL ? "إضافة دواء" : "Add medication"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Intake attach */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}>
        {isRTL ? "فحص الاستقبال (اختياري)" : "Intake exam (optional)"}
      </Text>
      <View style={[styles.modeRow, { flexDirection: dir }]}>
        {modeChip(isRTL ? "بدون" : "None", intakeMode === "none", () => setIntakeMode("none"))}
        {modeChip(
          isRTL ? "موجود" : "Existing",
          intakeMode === "existing",
          () => setIntakeMode("existing"),
        )}
        {modeChip(isRTL ? "جديد" : "New", intakeMode === "new", () => setIntakeMode("new"))}
      </View>

      {intakeMode === "existing" ? (
        uniqueAssignments.length === 0 ? (
          <Text style={{ color: colors.mutedForeground, fontSize: 13, textAlign }}>
            {isRTL ? "لا توجد فحوصات استقبال سابقة." : "No previous intake exams."}
          </Text>
        ) : (
          <View style={{ gap: 8, marginBottom: 8 }}>
            {uniqueAssignments.map((row) => {
              const aid = row.intakeExam?.assignmentId;
              if (!aid) return null;
              const selected = selectedAssignmentId === aid;
              return (
                <Pressable
                  key={aid}
                  onPress={() => setSelectedAssignmentId(aid)}
                  style={[
                    styles.linkRow,
                    {
                      flexDirection: dir,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? `${colors.primary}12` : colors.muted,
                    },
                  ]}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "600", flex: 1, textAlign }}>
                    {row.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )
      ) : null}

      {intakeMode === "new" ? (
        intakeTests.length === 0 ? (
          <Text style={{ color: colors.mutedForeground, fontSize: 13, textAlign }}>
            {isRTL
              ? "أنشئ نموذج فحص استقبال من لوحة الطبيب أولًا."
              : "Create an intake exam template from the doctor panel first."}
          </Text>
        ) : (
          <View style={{ gap: 8, marginBottom: 8 }}>
            {intakeTests.map((test) => {
              const selected = selectedTestId === test.id;
              return (
                <Pressable
                  key={test.id}
                  onPress={() => setSelectedTestId(test.id)}
                  style={[
                    styles.linkRow,
                    {
                      flexDirection: dir,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? `${colors.primary}12` : colors.muted,
                    },
                  ]}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "600", flex: 1, textAlign }}>
                    {test.name}
                  </Text>
                </Pressable>
              );
            })}
            <Text style={[styles.hint, { color: colors.mutedForeground, textAlign }]}>
              {isRTL
                ? "الموعد النهائي الافتراضي: غدًا (يمكن تعديله لاحقًا من فحوصات الاستقبال)."
                : "Default deadline: tomorrow (adjust later from intake exams)."}
            </Text>
            <AppTextInput
              value={intakeDeadline}
              onChangeText={setIntakeDeadline}
              placeholder="ISO deadline"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, textAlign }]}
            />
          </View>
        )
      ) : null}

      <Text style={[styles.label, { color: colors.mutedForeground, textAlign }]}>
        {noteLabel ?? (isRTL ? "رسالة للمريض (اختياري)" : "Message to patient (optional)")}
      </Text>
      <AppTextInput
        value={note}
        onChangeText={setNote}
        placeholder={notePlaceholder ?? (isRTL ? "أضف رسالة…" : "Add a message…")}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          styles.noteInput,
          { backgroundColor: colors.muted, color: colors.foreground, textAlign },
        ]}
        multiline
        maxLength={500}
        editable={!saving}
      />

      <Pressable
        onPress={submit}
        disabled={!canSubmit}
        style={[
          styles.submitBtn,
          { backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.6 },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
            {submitLabel ??
              (isRTL ? "حفظ وإرسال في المحادثة" : "Save & send in chat")}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  webScroll: {
    maxHeight: "min(68vh, 640px)" as unknown as number,
  },
  scroll: { paddingBottom: 8 },
  header: { alignItems: "center", gap: 12, marginBottom: 16 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: "800", marginTop: 12, marginBottom: 4 },
  hint: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  modeRow: { gap: 8, flexWrap: "wrap", marginBottom: 10 },
  modeChip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 48,
    marginBottom: 8,
  },
  noteInput: { minHeight: 72 },
  symptomRow: { alignItems: "center", gap: 8, marginBottom: 8 },
  symptomInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  addSymptom: { alignItems: "center", gap: 6, marginBottom: 8 },
  linkRow: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  linkCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  medCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  medHead: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  aiBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  submitBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
});
