import {
  Activity,
  Beaker,
  Clock,
  Expand,
  ExternalLink,
  FileText,
  MessageCircle,
  Pill,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { IntakeExamTaker } from "@/components/intake/IntakeExamTaker";
import { MedicalRecordAttachmentImage } from "@/components/medical/MedicalRecordAttachmentImage";
import { MedicalRecordAiInsightSection } from "@/components/medical/MedicalRecordAiInsightSection";
import {
  isMedicalImageAttachment,
  isMedicalPdfAttachment,
  MEDICAL_RECORD_CATEGORY_META,
} from "@/components/medical/medicalRecordMeta";
import type { MedicalPdfView } from "@/components/medical/MedicalPdfViewer";
import type { LinkedConsultationSummary, MedicalRecord } from "@/domains/medical/types";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useMedicalRecordPreviewDetail } from "@/hooks/useMedicalRecordPreviewDetail";
import { localeTag } from "@/utils/rtl";

interface Props {
  record: MedicalRecord | null;
  onOpenPdf?: (view: MedicalPdfView) => void;
  onZoomImage?: (uri: string) => void;
  doctorView?: boolean;
  patientUserId?: string;
}

function consultationStatusLabel(
  status: LinkedConsultationSummary["status"],
  isRTL: boolean,
): string {
  switch (status) {
    case "open":
      return isRTL ? "مفتوحة" : "Open";
    case "pending":
      return isRTL ? "قيد الانتظار" : "Waiting";
    case "ended":
      return isRTL ? "منتهية" : "Completed";
    case "cancelled":
    case "rejected":
      return isRTL ? "ملغاة" : "Cancelled";
    default:
      return status;
  }
}

function SectionBlock({
  title,
  icon,
  accent,
  colors,
  textAlign,
  dir,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  colors: ReturnType<typeof useColors>;
  textAlign: "left" | "right";
  dir: "row" | "row-reverse";
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.sectionHeader, { flexDirection: dir }]}>
        <View style={[styles.sectionIcon, { backgroundColor: `${accent}14` }]}>{icon}</View>
        <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function MedicalRecordDetailViewer({
  record,
  onOpenPdf,
  onZoomImage,
  doctorView,
  patientUserId,
}: Props) {
  const colors = useColors();
  const { isRTL, t } = useI18n();
  const dir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const dateLocale = localeTag(isRTL);
  const { record: detail, loading } = useMedicalRecordPreviewDetail(record, {
    doctorView,
    patientUserId,
  });

  if (!record) {
    return (
      <View
        style={[
          styles.panel,
          styles.emptyShell,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.emptyTitle, { color: colors.foreground, textAlign }]}>
          {isRTL ? "اختر سجلاً للعرض" : "Select a record to view"}
        </Text>
        <Text style={[styles.emptyBody, { color: colors.mutedForeground, textAlign }]}>
          {isRTL
            ? "اختر عنصراً من القائمة على اليسار لعرض التفاصيل والمرفقات."
            : "Choose an item from the left panel to preview details and attachments."}
        </Text>
      </View>
    );
  }

  const active = detail ?? record;
  const meta = MEDICAL_RECORD_CATEGORY_META[active.category];
  const Icon = meta.Icon;
  const categoryLabel = isRTL ? meta.labelAr : meta.labelEn;
  const isDiagnosis = active.category === "diagnosis";
  const isPrescription = active.category === "prescription";
  const isLabOrXray = active.category === "lab" || active.category === "xray";
  const isImg = !!active.fileUrl && isMedicalImageAttachment(active.fileUrl, active.fileName);
  const isPdf = !!active.fileUrl && isMedicalPdfAttachment(active.fileUrl, active.fileName);
  const formattedDate = new Date(active.date).toLocaleDateString(dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedCreated = new Date(active.createdAt).toLocaleString(dateLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <View style={styles.panel}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              {isRTL ? "جاري تحميل التفاصيل…" : "Loading details…"}
            </Text>
          </View>
        ) : null}

        <View style={[styles.headerRow, { flexDirection: dir }]}>
          <View style={[styles.categoryBadge, { backgroundColor: `${meta.color}18` }]}>
            <Icon size={14} color={meta.color} />
            <Text style={[styles.categoryBadgeText, { color: meta.color }]}>{categoryLabel}</Text>
          </View>
          <Text style={[styles.dateCaption, { color: colors.mutedForeground, textAlign }]}>
            {formattedDate}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground, textAlign }]}>{active.title}</Text>

        {isDiagnosis && active.doctorName ? (
          <Text style={[styles.metaLine, { color: colors.mutedForeground, textAlign }]}>
            {t.records.doctorPrefix(active.doctorName)}
          </Text>
        ) : null}

        <View style={[styles.metaGrid, { flexDirection: dir }]}>
          {active.bodyPart ? (
            <Text
              style={[
                styles.bodyPartChip,
                { color: colors.primary, backgroundColor: `${colors.primary}14` },
              ]}
            >
              {t.records.bodyParts[active.bodyPart]}
            </Text>
          ) : null}
          <View style={[styles.addedRow, { flexDirection: dir }]}>
            <Clock size={13} color={colors.mutedForeground} />
            <Text style={[styles.addedText, { color: colors.mutedForeground, textAlign }]}>
              {isRTL ? "أُضيف في " : "Added "}
              {formattedCreated}
            </Text>
          </View>
        </View>

        {isImg && active.fileUrl ? (
          <View
            style={[
              styles.mediaFrame,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <MedicalRecordAttachmentImage
              uri={active.fileUrl}
              contentFit="contain"
              style={styles.mediaImage}
            />
            <Pressable
              onPress={() => onZoomImage?.(active.fileUrl!)}
              style={[styles.expandBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={isRTL ? "تكبير الصورة" : "Expand image"}
            >
              <Expand size={16} color={colors.foreground} />
              <Text style={[styles.expandBtnText, { color: colors.foreground }]}>
                {isRTL ? "تكبير" : "Expand"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {active.fileUrl && isPdf ? (
          <Pressable
            onPress={() => onOpenPdf?.({ uri: active.fileUrl!, fileName: active.fileName })}
            style={[
              styles.pdfCard,
              { backgroundColor: colors.muted, borderColor: colors.border, flexDirection: dir },
            ]}
          >
            <FileText size={28} color={colors.primary} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.pdfTitle, { color: colors.foreground, textAlign }]}>
                {active.fileName ?? (isRTL ? "مستند PDF" : "PDF document")}
              </Text>
              <Text style={[styles.pdfHint, { color: colors.mutedForeground, textAlign }]}>
                {isRTL ? "اضغط للعرض" : "Tap to open viewer"}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {active.pdfUrl && isPrescription ? (
          <Pressable
            onPress={() =>
              onOpenPdf?.({
                uri: active.pdfUrl!,
                fileName: isRTL ? "الروشتة.pdf" : "prescription.pdf",
              })
            }
            style={[
              styles.pdfCard,
              { backgroundColor: colors.muted, borderColor: colors.border, flexDirection: dir },
            ]}
          >
            <FileText size={28} color={colors.primary} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.pdfTitle, { color: colors.foreground, textAlign }]}>
                {isRTL ? "روشتة PDF" : "Prescription PDF"}
              </Text>
              <Text style={[styles.pdfHint, { color: colors.mutedForeground, textAlign }]}>
                {isRTL ? "اضغط للعرض" : "Tap to open viewer"}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {active.fileUrl && !isImg && !isPdf ? (
          <Pressable
            onPress={() => Linking.openURL(active.fileUrl!)}
            style={[
              styles.pdfCard,
              { backgroundColor: colors.muted, borderColor: colors.border, flexDirection: dir },
            ]}
          >
            <ExternalLink size={22} color={colors.primary} />
            <Text style={[styles.pdfTitle, { color: colors.foreground, textAlign, flex: 1 }]}>
              {active.fileName ?? (isRTL ? "فتح المرفق" : "Open attachment")}
            </Text>
          </Pressable>
        ) : null}

        {active.value ? (
          <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, textAlign }]}>
              {isRTL ? "القيمة" : "Value"}
            </Text>
            <Text style={[styles.noteBody, { color: colors.foreground, textAlign }]}>{active.value}</Text>
          </View>
        ) : null}

        {active.notes ? (
          <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, textAlign }]}>
              {isLabOrXray ? (isRTL ? "الوصف" : "Description") : isRTL ? "ملاحظات" : "Notes"}
            </Text>
            <Text style={[styles.noteBody, { color: colors.foreground, textAlign }]}>{active.notes}</Text>
          </View>
        ) : null}

        {active.category !== "intake" ? (
          <MedicalRecordAiInsightSection record={active} />
        ) : null}

        {active.category === "intake" && active.intakeExam ? (
          <SectionBlock
            title={isRTL ? "إجابات المريض" : "Patient answers"}
            icon={<FileText size={18} color={meta.color} />}
            accent={meta.color}
            colors={colors}
            textAlign={textAlign}
            dir={dir}
          >
            <IntakeExamTaker
              isRTL={isRTL}
              questions={active.intakeExam.questions}
              answers={active.intakeExam.answers}
              readOnly
            />
          </SectionBlock>
        ) : null}

        {isDiagnosis ? (
          <SectionBlock
            title={isRTL ? "الأعراض" : "Symptoms"}
            icon={<Activity size={18} color={meta.color} />}
            accent={meta.color}
            colors={colors}
            textAlign={textAlign}
            dir={dir}
          >
            {active.symptoms?.length ? (
              active.symptoms.map((symptom) => (
                <Text
                  key={symptom.id}
                  style={[styles.noteBody, { color: colors.foreground, textAlign }]}
                >
                  • {symptom.desc}
                </Text>
              ))
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign }}>
                {isRTL ? "لا توجد أعراض مسجلة" : "No symptoms recorded"}
              </Text>
            )}
          </SectionBlock>
        ) : null}

        {isDiagnosis ? (
          <SectionBlock
            title={isRTL ? "نتائج مرتبطة" : "Linked results"}
            icon={<Beaker size={18} color="#10b981" />}
            accent="#10b981"
            colors={colors}
            textAlign={textAlign}
            dir={dir}
          >
            {active.linkedDocuments?.length ? (
              <View style={styles.linkedList}>
                {active.linkedDocuments.map((doc) => {
                  const docMeta = MEDICAL_RECORD_CATEGORY_META[doc.category];
                  const docIsImage = isMedicalImageAttachment(doc.fileUrl, doc.fileName);
                  return (
                    <View
                      key={doc.id}
                      style={[styles.linkedRow, { borderColor: colors.border, flexDirection: dir }]}
                    >
                      {docIsImage && doc.fileUrl ? (
                        <MedicalRecordAttachmentImage uri={doc.fileUrl} style={styles.linkedThumb} />
                      ) : (
                        <View
                          style={[
                            styles.linkedThumb,
                            styles.linkedThumbPlaceholder,
                            { backgroundColor: `${docMeta.color}22` },
                          ]}
                        >
                          <docMeta.Icon size={20} color={docMeta.color} />
                        </View>
                      )}
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Text
                          style={{ color: colors.foreground, fontWeight: "700", textAlign }}
                          numberOfLines={2}
                        >
                          {doc.title}
                        </Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign }}>
                          {isRTL ? docMeta.labelAr : docMeta.labelEn}
                        </Text>
                        {doc.notes ? (
                          <Text
                            style={{ color: colors.foreground, fontSize: 13, textAlign, marginTop: 4 }}
                            numberOfLines={4}
                          >
                            {doc.notes}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign }}>
                {isRTL
                  ? "لا توجد نتائج مختبر أو أشعة أو روشتات مرتبطة"
                  : "No linked lab results, imaging, or prescriptions"}
              </Text>
            )}
          </SectionBlock>
        ) : null}

        {isLabOrXray && active.linkedDiagnoses?.length ? (
          <SectionBlock
            title={isRTL ? "تشخيصات مرتبطة" : "Linked diagnoses"}
            icon={<Activity size={18} color="#ef4444" />}
            accent="#ef4444"
            colors={colors}
            textAlign={textAlign}
            dir={dir}
          >
            <View style={styles.linkedList}>
              {active.linkedDiagnoses.map((diag) => (
                <View
                  key={diag.id}
                  style={[styles.linkedRow, { borderColor: colors.border, flexDirection: dir }]}
                >
                  <View
                    style={[
                      styles.linkedThumb,
                      styles.linkedThumbPlaceholder,
                      { backgroundColor: "#ef444422" },
                    ]}
                  >
                    <Activity size={20} color="#ef4444" />
                  </View>
                  <Text
                    style={{ color: colors.foreground, fontWeight: "700", textAlign, flex: 1 }}
                    numberOfLines={3}
                  >
                    {diag.title}
                  </Text>
                </View>
              ))}
            </View>
          </SectionBlock>
        ) : null}

        {isPrescription ? (
          <SectionBlock
            title={isRTL ? "الأدوية" : "Medications"}
            icon={<Pill size={18} color={meta.color} />}
            accent={meta.color}
            colors={colors}
            textAlign={textAlign}
            dir={dir}
          >
            {active.medications?.length ? (
              <View style={styles.linkedList}>
                {active.medications.map((med, index) => (
                  <View
                    key={med.id ?? `med-${index}`}
                    style={[styles.medRow, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  >
                    <Text style={[styles.medName, { color: colors.foreground, textAlign }]}>
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
                ))}
              </View>
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign }}>
                {isRTL ? "لا توجد أدوية مسجلة" : "No medications recorded"}
              </Text>
            )}
          </SectionBlock>
        ) : null}

        {isPrescription && active.linkedConsultations?.length ? (
          <SectionBlock
            title={isRTL ? "استشارات مرتبطة" : "Linked consultations"}
            icon={<MessageCircle size={18} color={colors.primary} />}
            accent={colors.primary}
            colors={colors}
            textAlign={textAlign}
            dir={dir}
          >
            <View style={styles.linkedList}>
              {active.linkedConsultations.map((consultation) => {
                const title = doctorView ? consultation.patientName : consultation.doctorName;
                return (
                  <View
                    key={consultation.id}
                    style={[styles.linkedRow, { borderColor: colors.border, flexDirection: dir }]}
                  >
                    <View
                      style={[
                        styles.linkedThumb,
                        styles.linkedThumbPlaceholder,
                        { backgroundColor: `${colors.primary}22` },
                      ]}
                    >
                      <MessageCircle size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={{ color: colors.foreground, fontWeight: "700", textAlign }}
                        numberOfLines={2}
                      >
                        {title}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign }}>
                        {consultationStatusLabel(consultation.status, isRTL)}
                        {" · "}
                        {new Date(consultation.createdAt).toLocaleDateString(dateLocale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </SectionBlock>
        ) : null}
      </ScrollView>
    </View>
  );
}

const mediaFrameBase: ViewStyle = {
  borderRadius: 16,
  borderWidth: StyleSheet.hairlineWidth,
  overflow: "hidden",
  marginTop: 16,
  maxHeight: 500,
  minHeight: 200,
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
};

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    width: "100%",
    minHeight: 480,
    alignSelf: "stretch",
  },
  scroll: { flex: 1, width: "100%" },
  scrollContent: { padding: 24, paddingBottom: 96, flexGrow: 1, gap: 0 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  emptyShell: {
    flex: 1,
    minHeight: 480,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, lineHeight: 21, maxWidth: 320 },
  headerRow: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: "700" },
  dateCaption: { fontSize: 13, flex: 1 },
  title: { fontSize: 22, fontWeight: "800", lineHeight: 28, marginBottom: 4 },
  metaLine: { fontSize: 14, marginBottom: 4 },
  metaGrid: { flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 4 },
  bodyPartChip: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  addedRow: { alignItems: "center", gap: 6 },
  addedText: { fontSize: 12 },
  mediaFrame: mediaFrameBase,
  mediaImage: {
    width: "100%",
    height: 480,
    maxHeight: 500,
  },
  expandBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  expandBtnText: { fontSize: 13, fontWeight: "600" },
  pdfCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 12,
  },
  pdfTitle: { fontSize: 15, fontWeight: "600" },
  pdfHint: { fontSize: 13, marginTop: 2 },
  notesCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  noteBody: { fontSize: 15, lineHeight: 22 },
  sectionCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  sectionHeader: { alignItems: "center", gap: 10 },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  linkedList: { gap: 10 },
  linkedRow: {
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  linkedThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: "hidden",
  },
  linkedThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  medRow: {
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  medName: { fontSize: 15, fontWeight: "700" },
});
