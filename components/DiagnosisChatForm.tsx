import { Plus, Stethoscope, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fetchDocumentsForPatientUser } from "@/domains/medical/api";
import type { MedicalRecord } from "@/domains/medical/types";
import { useColors } from "@/hooks/useColors";
import { flexRow } from "@/utils/rtl";

export interface DiagnosisChatFormProps {
  visible: boolean;
  isRTL: boolean;
  patientUserId: string;
  accessToken: string;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    description: string;
    symptoms: string[];
    documentIds: string[];
    note?: string;
  }) => void;
}

export function DiagnosisChatForm({
  visible,
  isRTL,
  patientUserId,
  accessToken,
  saving = false,
  onClose,
  onSubmit,
}: DiagnosisChatFormProps) {
  const colors = useColors();
  const dir = flexRow(isRTL);
  const [description, setDescription] = useState("");
  const [symptomLines, setSymptomLines] = useState<string[]>([""]);
  const [note, setNote] = useState("");
  const [linkableDocs, setLinkableDocs] = useState<MedicalRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setDescription("");
      setSymptomLines([""]);
      setNote("");
      setSelectedDocumentIds([]);
      setLinkableDocs([]);
      return;
    }

    let cancelled = false;
    setLoadingDocs(true);
    void fetchDocumentsForPatientUser(patientUserId, accessToken)
      .then((docs) => {
        if (cancelled) return;
        setLinkableDocs(docs.filter((d) => d.category === "lab" || d.category === "xray"));
      })
      .catch(() => {
        if (!cancelled) setLinkableDocs([]);
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

  const submit = () => {
    const desc = description.trim();
    if (!desc || saving) return;
    const symptoms = symptomLines.map((s) => s.trim()).filter(Boolean);
    const trimmedNote = note.trim();
    onSubmit({
      description: desc,
      symptoms,
      documentIds: selectedDocumentIds,
      note: trimmedNote || undefined,
    });
  };

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
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {isRTL ? "إضافة تشخيص" : "Add diagnosis"}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={8} disabled={saving}>
          <X size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <Text style={[styles.label, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {isRTL ? "وصف التشخيص" : "Diagnosis description"}
      </Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={isRTL ? "مثال: التهاب الشعب الهوائية" : "e.g. Acute bronchitis"}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            backgroundColor: colors.muted,
            color: colors.foreground,
            textAlign: isRTL ? "right" : "left",
          },
        ]}
        multiline
        maxLength={500}
        editable={!saving}
      />

      <Text style={[styles.label, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {isRTL ? "الأعراض (اختياري)" : "Symptoms (optional)"}
      </Text>
      {symptomLines.map((line, index) => (
        <View key={index} style={[styles.symptomRow, { flexDirection: dir }]}>
          <TextInput
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
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
                textAlign: isRTL ? "right" : "left",
              },
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

      <Text style={[styles.label, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {isRTL ? "ربط نتائج المختبر / الأشعة (اختياري)" : "Link lab results / X-rays (optional)"}
      </Text>
      {loadingDocs ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
      ) : linkableDocs.length === 0 ? (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 13,
            textAlign: isRTL ? "right" : "left",
            marginBottom: 8,
          }}
        >
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
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 11,
                      fontWeight: "600",
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {catLabel}
                  </Text>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontWeight: "600",
                      textAlign: isRTL ? "right" : "left",
                    }}
                    numberOfLines={2}
                  >
                    {doc.title}
                  </Text>
                  {doc.linkedDiagnoses && doc.linkedDiagnoses.length > 0 ? (
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: 11,
                        marginTop: 2,
                        textAlign: isRTL ? "right" : "left",
                      }}
                      numberOfLines={1}
                    >
                      {isRTL
                        ? `مرتبط بـ ${doc.linkedDiagnoses.length} تشخيص`
                        : `Linked to ${doc.linkedDiagnoses.length} diagnosis${doc.linkedDiagnoses.length === 1 ? "" : "es"}`}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={[styles.label, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {isRTL ? "رسالة للمريض (اختياري)" : "Message to patient (optional)"}
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={isRTL ? "أضف رسالة…" : "Add a message…"}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          styles.noteInput,
          {
            backgroundColor: colors.muted,
            color: colors.foreground,
            textAlign: isRTL ? "right" : "left",
          },
        ]}
        multiline
        maxLength={500}
        editable={!saving}
      />

      <Pressable
        onPress={submit}
        disabled={saving || !description.trim()}
        style={[
          styles.submitBtn,
          {
            backgroundColor: colors.primary,
            opacity: saving || !description.trim() ? 0.6 : 1,
          },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
            {isRTL ? "حفظ وإرسال في المحادثة" : "Save & send in chat"}
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
  submitBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
});
