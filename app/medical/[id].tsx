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
  ScanLine,
  Trash2,
} from "lucide-react-native";
import React, { useEffect } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/domains/auth/store";
import { useMedicalStore } from "@/domains/medical/store";
import type { MedicalCategory } from "@/domains/medical/types";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

const CATEGORY_META: Record<
  MedicalCategory,
  { labelEn: string; labelAr: string; Icon: typeof Activity; color: string }
> = {
  symptom: { labelEn: "Symptom",     labelAr: "الأعراض",        Icon: Activity,     color: "#ef4444" },
  lab:     { labelEn: "Lab Result",  labelAr: "نتائج المختبر",  Icon: Beaker,       color: "#10b981" },
  xray:    { labelEn: "X-ray / Scan",labelAr: "الأشعة والمسح", Icon: ScanLine,     color: "#8b5cf6" },
  intake:  { labelEn: "Intake Exam", labelAr: "فحص الاستقبال", Icon: ClipboardList, color: "#3057F2" },
};

export default function MedicalRecordDetail() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const profile = useAuthStore((s) => s.profile);
  const records = useMedicalStore((s) => s.records);
  const load    = useMedicalStore((s) => s.load);
  const remove  = useMedicalStore((s) => s.remove);

  useEffect(() => {
    if (profile) load(profile.id);
  }, [profile?.id]);

  const record = records.find((r) => r.id === id);

  if (!record) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>
          {isRTL ? "السجل غير موجود" : "Record not found"}
        </Text>
      </View>
    );
  }

  const meta  = CATEGORY_META[record.category];
  const { Icon, color } = meta;
  const label = isRTL ? meta.labelAr : meta.labelEn;
  const dir   = isRTL ? "row-reverse" : "row";

  const confirmDelete = () => {
    Alert.alert(
      isRTL ? "حذف السجل" : "Delete record",
      isRTL ? `حذف "${record.title}"؟` : `Delete "${record.title}"?`,
      [
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: isRTL ? "حذف" : "Delete",
          style: "destructive",
          onPress: () => {
            remove(profile!.id, record.id);
            router.back();
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

        <Pressable onPress={confirmDelete} style={styles.headerBtn} hitSlop={10}>
          <Trash2 size={20} color="#fff" />
        </Pressable>
      </View>

      {/* ── Title band ── */}
      <View style={[styles.titleBand, { backgroundColor: color + "18", borderBottomColor: color + "30" }]}>
        <View style={[styles.titleRow, { flexDirection: dir }]}>
          <View style={[styles.titleIcon, { backgroundColor: color + "25" }]}>
            <Icon size={22} color={color} />
          </View>
          <Text
            style={[styles.title, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
          >
            {record.title}
          </Text>
        </View>
      </View>

      {/* ── Detail cards ── */}
      <ScrollView contentContainerStyle={styles.body}>

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
            label={isRTL ? "ملاحظات" : "Notes"}
            value={record.notes}
            color={color}
            colors={colors}
            isRTL={isRTL}
          />
        ) : null}

        <DetailCard
          icon={<Calendar size={18} color={color} />}
          label={isRTL ? "التاريخ" : "Date"}
          value={new Date(record.date).toLocaleDateString(
            isRTL ? "ar-EG" : "en-US",
            { year: "numeric", month: "long", day: "numeric" },
          )}
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
          <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
            {isRTL ? "أُضيف في:" : "Added:"}
          </Text>
          <Text style={[styles.metaValue, { color: colors.foreground }]}>
            {new Date(record.createdAt).toLocaleString(
              isRTL ? "ar-EG" : "en-US",
              { dateStyle: "medium", timeStyle: "short" },
            )}
          </Text>
        </View>

        {/* Delete button */}
        <Pressable
          onPress={confirmDelete}
          style={[styles.deleteBtn, { borderColor: "#ef4444" }]}
        >
          <Trash2 size={16} color="#ef4444" />
          <Text style={styles.deleteBtnText}>
            {isRTL ? "حذف هذا السجل" : "Delete this record"}
          </Text>
        </Pressable>
      </ScrollView>
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
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.cardHeader, { flexDirection: dir }]}>
        <View style={[styles.cardIconWrap, { backgroundColor: color + "18" }]}>
          {icon}
        </View>
        <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.cardValue,
          { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
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
  title: { fontSize: 22, fontWeight: "800", flex: 1, lineHeight: 28 },

  body: { padding: 16, gap: 12, paddingBottom: 40 },

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
