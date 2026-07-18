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
  View,
  type ViewStyle,
} from "react-native";
import { AppTextInput } from "@/components/AppTextInput";
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

function defaultDeadlineDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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
  const [deadlineDate, setDeadlineDate] = useState(defaultDeadlineDate);
  const [deadlineTime, setDeadlineTime] = useState("09:00");
  const [recurrence, setRecurrence] = useState<IntakeExamRecurrence>("none");
  const [interval, setInterval] = useState("1");
  const [assigning, setAssigning] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  useEffect(() => {
    if (!visible || !accessToken) return;
    setDeadlineDate(defaultDeadlineDate());
    setDeadlineTime("09:00");
    // One-shot by default: patient status updates stay on the same instance.
    setRecurrence("none");
    setInterval("1");
    setLoading(true);
    void fetchIntakeTests(accessToken)
      .then((rows) => {
        const active = rows.filter((t) => t.is_active);
        setTests(active);
        setSelectedId(active[0]?.id ?? null);
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
        isRTL
          ? "اختر فحصًا وأدخل الموعد النهائي."
          : "Select an exam and enter a deadline.",
      );
      return;
    }
    if (!recurrence) {
      Alert.alert(
        isRTL ? "بيانات ناقصة" : "Missing data",
        isRTL
          ? "حدد عدد مرات تكرار الفحص."
          : "Choose how often the exam should happen.",
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
  const frequencyHint =
    recurrence === "weekly"
      ? isRTL
        ? "سيُطلب من المريض إعادة الفحص كل أسبوع."
        : "The patient will be asked to repeat this exam every week."
      : recurrence === "monthly"
        ? isRTL
          ? "سيُطلب من المريض إعادة الفحص كل شهر."
          : "The patient will be asked to repeat this exam every month."
        : recurrence === "daily"
          ? isRTL
            ? "سيُطلب من المريض إعادة الفحص يوميًا."
            : "The patient will be asked to repeat this exam every day."
          : recurrence === "yearly"
            ? isRTL
              ? "سيُطلب من المريض إعادة الفحص كل سنة."
              : "The patient will be asked to repeat this exam every year."
            : isRTL
              ? "فحص لمرة واحدة فقط."
              : "One-time exam only.";

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
                  {isRTL ? "اختر الفحص *" : "Select exam *"}
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
                  {isRTL ? "الموعد النهائي *" : "Deadline *"}
                </Text>
                <Text
                  style={[
                    styles.hint,
                    { color: colors.mutedForeground, textAlign },
                  ]}
                >
                  {isRTL
                    ? "متى يجب أن يُكمل المريض هذا الفحص؟"
                    : "When should the patient complete this exam?"}
                </Text>
                <View style={[styles.row, { gap: 8 }]}>
                  <AppTextInput
                    value={deadlineDate}
                    onChangeText={setDeadlineDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.mutedForeground}
                    {...(isWeb ? ({ type: "date" } as object) : {})}
                    style={[
                      styles.input,
                      {
                        flex: 1,
                        color: colors.foreground,
                        borderColor: !deadlineDate.trim() ? colors.destructive : colors.border,
                        textAlign,
                      },
                    ]}
                  />
                  <AppTextInput
                    value={deadlineTime}
                    onChangeText={setDeadlineTime}
                    placeholder="HH:mm"
                    placeholderTextColor={colors.mutedForeground}
                    {...(isWeb ? ({ type: "time" } as object) : {})}
                    style={[
                      styles.input,
                      {
                        width: 110,
                        color: colors.foreground,
                        borderColor: colors.border,
                        textAlign,
                      },
                    ]}
                  />
                </View>

                <Text style={[styles.label, { color: colors.mutedForeground, textAlign }]}>
                  {isRTL ? "كم مرة يُعاد الفحص؟ *" : "How often should it happen? *"}
                </Text>
                <Text
                  style={[
                    styles.hint,
                    { color: colors.mutedForeground, textAlign },
                  ]}
                >
                  {isRTL
                    ? "مرة واحدة، أسبوعيًا، شهريًا، أو أكثر."
                    : "Once, weekly, monthly, or another cadence."}
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
                        <Text
                          style={{
                            color: active ? colors.primary : colors.foreground,
                            fontSize: 12,
                            fontWeight: active ? "800" : "600",
                          }}
                        >
                          {isRTL ? opt.labelAr : opt.labelEn}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text
                  style={[
                    styles.hint,
                    { color: colors.primary, textAlign, marginTop: 6 },
                  ]}
                >
                  {frequencyHint}
                </Text>

                {recurrence !== "none" ? (
                  <>
                    <Text style={[styles.label, { color: colors.mutedForeground, textAlign }]}>
                      {isRTL ? "كل (عدد)" : "Every (count)"}
                    </Text>
                    <AppTextInput
                      value={interval}
                      onChangeText={setInterval}
                      keyboardType="number-pad"
                      style={[
                        styles.input,
                        { color: colors.foreground, borderColor: colors.border, textAlign },
                      ]}
                    />
                    <Text
                      style={[
                        styles.hint,
                        { color: colors.mutedForeground, textAlign },
                      ]}
                    >
                      {isRTL
                        ? recurrence === "weekly"
                          ? "مثال: 1 = كل أسبوع، 2 = كل أسبوعين"
                          : recurrence === "monthly"
                            ? "مثال: 1 = كل شهر، 2 = كل شهرين"
                            : "مثال: 1 = كل فترة"
                        : recurrence === "weekly"
                          ? "e.g. 1 = every week, 2 = every 2 weeks"
                          : recurrence === "monthly"
                            ? "e.g. 1 = every month, 2 = every 2 months"
                            : "e.g. 1 = every period"}
                    </Text>
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
  label: { fontSize: 13, fontWeight: "700", marginTop: 10 },
  hint: { fontSize: 12, fontWeight: "500", marginBottom: 6, marginTop: 2 },
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
