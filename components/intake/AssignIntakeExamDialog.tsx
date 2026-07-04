import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { IntakeExamBuilderForm } from "@/components/intake/IntakeExamBuilderForm";
import {
  assignIntakeExam,
  fetchIntakeTests,
} from "@/domains/intake-exams/api";
import type { IntakeExamRecurrence, IntakeTestTemplate } from "@/domains/intake-exams/types";
import { useColors } from "@/hooks/useColors";

const RECURRENCE_OPTIONS: { value: IntakeExamRecurrence; labelEn: string; labelAr: string }[] = [
  { value: "none", labelEn: "Once", labelAr: "مرة واحدة" },
  { value: "daily", labelEn: "Daily", labelAr: "يومي" },
  { value: "weekly", labelEn: "Weekly", labelAr: "أسبوعي" },
  { value: "monthly", labelEn: "Monthly", labelAr: "شهري" },
  { value: "yearly", labelEn: "Yearly", labelAr: "سنوي" },
];

interface Props {
  visible: boolean;
  isRTL: boolean;
  patientUserId: string;
  accessToken: string;
  saving?: boolean;
  onClose: () => void;
  onAssigned: (instance: Awaited<ReturnType<typeof assignIntakeExam>>) => void;
}

export function AssignIntakeExamDialog({
  visible,
  isRTL,
  patientUserId,
  accessToken,
  saving = false,
  onClose,
  onAssigned,
}: Props) {
  const colors = useColors();
  const textAlign = isRTL ? "right" : "left";
  const [tests, setTests] = useState<IntakeTestTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("09:00");
  const [recurrence, setRecurrence] = useState<IntakeExamRecurrence>("none");
  const [interval, setInterval] = useState("1");
  const [assigning, setAssigning] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  useEffect(() => {
    if (!visible || !accessToken) return;
    setLoading(true);
    void fetchIntakeTests(accessToken)
      .then((rows) => {
        setTests(rows.filter((t) => t.is_active));
        setSelectedId(rows[0]?.id ?? null);
      })
      .catch((e) => Alert.alert(isRTL ? "خطأ" : "Error", (e as Error).message))
      .finally(() => setLoading(false));
  }, [visible, accessToken, isRTL]);

  const selected = useMemo(
    () => tests.find((t) => t.id === selectedId) ?? null,
    [tests, selectedId],
  );

  const assign = async () => {
    if (!selectedId || !deadlineDate.trim()) {
      Alert.alert(
        isRTL ? "بيانات ناقصة" : "Missing data",
        isRTL ? "اختر فحصًا وحدد الموعد النهائي." : "Select an exam and set a deadline.",
      );
      return;
    }
    const deadlineAt = new Date(`${deadlineDate.trim()}T${deadlineTime || "09:00"}:00`);
    if (Number.isNaN(deadlineAt.getTime())) {
      Alert.alert(isRTL ? "تاريخ غير صالح" : "Invalid date", isRTL ? "تحقق من التاريخ." : "Check the date.");
      return;
    }
    setAssigning(true);
    try {
      const instance = await assignIntakeExam(
        {
          patient_user_id: patientUserId,
          intake_test_id: selectedId,
          deadline_at: deadlineAt.toISOString(),
          recurrence_type: recurrence,
          recurrence_interval: Math.max(1, Number.parseInt(interval, 10) || 1),
        },
        accessToken,
      );
      onAssigned(instance);
      onClose();
    } catch (e) {
      Alert.alert(isRTL ? "فشل الإرسال" : "Assign failed", (e as Error).message);
    } finally {
      setAssigning(false);
    }
  };

  const isWeb = Platform.OS === "web";

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} disabled={assigning || saving} />
          <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground, textAlign }]}>
              {isRTL ? "إضافة فحص متابعة" : "Assign follow-up exam"}
            </Text>

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
            ) : tests.length === 0 ? (
              <View style={{ gap: 12 }}>
                <Text style={{ color: colors.mutedForeground, textAlign }}>
                  {isRTL
                    ? "لا توجد فحوصات. أنشئ فحصًا أولاً."
                    : "No exams yet. Create one first."}
                </Text>
                <Pressable
                  onPress={() => setBuilderOpen(true)}
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {isRTL ? "إنشاء فحص" : "Create exam"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: isWeb ? 520 : 460 }}>
                <Text style={[styles.label, { color: colors.mutedForeground, textAlign }]}>
                  {isRTL ? "اختر الفحص" : "Select exam"}
                </Text>
                {tests.map((test) => {
                  const active = test.id === selectedId;
                  return (
                    <Pressable
                      key={test.id}
                      onPress={() => setSelectedId(test.id)}
                      style={[
                        styles.testRow,
                        {
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? `${colors.primary}12` : colors.background,
                        },
                      ]}
                    >
                      <Text style={{ color: colors.foreground, fontWeight: "700", textAlign }}>
                        {test.name}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign }}>
                        {(test.questions ?? []).length} {isRTL ? "أسئلة" : "questions"}
                      </Text>
                    </Pressable>
                  );
                })}

                <Text style={[styles.label, { color: colors.mutedForeground, textAlign }]}>
                  {isRTL ? "الموعد النهائي" : "Deadline"}
                </Text>
                <View style={[styles.row, { gap: 8 }]}>
                  <TextInput
                    value={deadlineDate}
                    onChangeText={setDeadlineDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { flex: 1, color: colors.foreground, borderColor: colors.border, textAlign }]}
                  />
                  <TextInput
                    value={deadlineTime}
                    onChangeText={setDeadlineTime}
                    placeholder="HH:mm"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { width: 96, color: colors.foreground, borderColor: colors.border, textAlign }]}
                  />
                </View>

                <Text style={[styles.label, { color: colors.mutedForeground, textAlign }]}>
                  {isRTL ? "التكرار" : "Recurrence"}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {RECURRENCE_OPTIONS.map((opt) => {
                    const active = recurrence === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => setRecurrence(opt.value)}
                        style={[
                          styles.chip,
                          {
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active ? `${colors.primary}18` : colors.background,
                          },
                        ]}
                      >
                        <Text style={{ color: active ? colors.primary : colors.foreground, fontSize: 12 }}>
                          {isRTL ? opt.labelAr : opt.labelEn}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {recurrence !== "none" ? (
                  <>
                    <Text style={[styles.label, { color: colors.mutedForeground, textAlign }]}>
                      {isRTL ? "كل (عدد)" : "Every (count)"}
                    </Text>
                    <TextInput
                      value={interval}
                      onChangeText={setInterval}
                      keyboardType="number-pad"
                      style={[styles.input, { color: colors.foreground, borderColor: colors.border, textAlign }]}
                    />
                  </>
                ) : null}

                {selected?.description ? (
                  <Text style={{ color: colors.mutedForeground, marginTop: 8, textAlign }}>
                    {selected.description}
                  </Text>
                ) : null}
              </ScrollView>
            )}

            <View style={[styles.actions, { borderTopColor: colors.border }]}>
              <Pressable
                onPress={onClose}
                disabled={assigning || saving}
                style={[
                  styles.cancelBtn,
                  isWeb && styles.actionBtnWeb,
                  {
                    backgroundColor:
                      assigning || saving ? colors.muted : colors.destructive,
                    opacity: assigning || saving ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={styles.cancelBtnText}>{isRTL ? "إلغاء" : "Cancel"}</Text>
              </Pressable>

              <View style={styles.footer}>
                <Pressable
                  onPress={() => void assign()}
                  disabled={assigning || saving || loading || tests.length === 0}
                  style={[
                    styles.primaryBtn,
                    isWeb && styles.actionBtnWeb,
                    {
                      backgroundColor:
                        assigning || saving || tests.length === 0 ? colors.muted : colors.primary,
                    },
                  ]}
                >
                  {assigning ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {isRTL ? "إرسال للمريض" : "Send to patient"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={builderOpen} animationType="slide" onRequestClose={() => setBuilderOpen(false)}>
        <View style={[styles.builderRoot, { backgroundColor: colors.background }]}>
          <IntakeExamBuilderForm
            isRTL={isRTL}
            saving={assigning}
            onCancel={() => setBuilderOpen(false)}
            onSubmit={(payload) => {
              void (async () => {
                try {
                  const { createIntakeTest } = await import("@/domains/intake-exams/api");
                  const created = await createIntakeTest(payload, accessToken);
                  setTests((prev) => [created, ...prev]);
                  setSelectedId(created.id);
                  setBuilderOpen(false);
                } catch (e) {
                  Alert.alert(isRTL ? "فشل الحفظ" : "Save failed", (e as Error).message);
                }
              })();
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  dialog: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    zIndex: 1,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "800" },
  label: { fontSize: 13, fontWeight: "600", marginTop: 8 },
  testRow: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  row: { flexDirection: "row", alignItems: "center" },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  footer: { paddingTop: 4 },
  cancelBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  cancelBtnText: { color: "#fff", fontWeight: "700" },
  actions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 12,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
  },
  actionBtnWeb: {
    width: "20vw",
    alignSelf: "center",
    cursor: "pointer",
  } as ViewStyle,
  builderRoot: { flex: 1, paddingTop: 48 },
});
