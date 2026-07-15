import { router } from "expo-router";
import {
  Activity,
  Beaker,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  Pill,
  ScanLine,
  X,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MedicalHistoryFilterPanel } from "@/components/MedicalHistoryFilterPanel";
import { BodySkeletonView, bodyFigureViewportHeight } from "@/components/records/BodySkeletonView";
import {
  MedicalRecordAddBar,
} from "@/components/records/MedicalRecordAddBar";
import {
  RecordsViewModeToggle,
  type RecordsViewMode,
} from "@/components/records/RecordsViewModeToggle";
import {
  SHOW_INTAKE_RECORDS,
  withoutIntakeRecords,
} from "@/components/records/medicalRecordCategories";
import { buildMedicalAddHref } from "@/domains/medical/addHref";
import { buildBodyPartRecordsHref } from "@/domains/medical/bodyPartHref";
import type { BodyPart } from "@/domains/medical/bodyParts";
import {
  EMPTY_MEDICAL_FILTERS,
  filterMedicalRecords,
  hasActiveFilters,
  type MedicalHistoryFilters,
} from "@/domains/medical/search";
import type { MedicalCategory, MedicalRecord } from "@/domains/medical/types";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { alignText, flexRow, localeTag } from "@/utils/rtl";

const CATEGORIES: {
  key: MedicalCategory;
  labelEn: string;
  labelAr: string;
  Icon: typeof Activity;
  color: string;
}[] = [
  { key: "diagnosis", labelEn: "Diagnosis", labelAr: "التشخيص", Icon: Activity, color: "#ef4444" },
  { key: "lab", labelEn: "Lab results", labelAr: "نتائج المختبر", Icon: Beaker, color: "#10b981" },
  { key: "xray", labelEn: "X-rays & scans", labelAr: "الأشعة والمسح", Icon: ScanLine, color: "#8b5cf6" },
  { key: "prescription", labelEn: "Prescription", labelAr: "روشتة", Icon: Pill, color: "#f59e0b" },
  { key: "intake", labelEn: "Intake exam", labelAr: "فحص الاستقبال", Icon: ClipboardList, color: "#3057F2" },
];

const SEARCHABLE_CATEGORIES: MedicalCategory[] = ["diagnosis", "lab", "xray", "prescription"];
import { isMedicalImageAttachment } from "@/components/medical/medicalRecordMeta";

export interface MedicalHistoryListProps {
  records: MedicalRecord[];
  patientUserId: string;
  canAdd?: boolean;
  doctorView?: boolean;
  showIntake?: boolean;
}

export function MedicalHistoryList({
  records,
  patientUserId,
  canAdd = true,
  doctorView = false,
  showIntake = SHOW_INTAKE_RECORDS,
}: MedicalHistoryListProps) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [filters, setFilters] = useState<MedicalHistoryFilters>(EMPTY_MEDICAL_FILTERS);
  const [openSection, setOpenSection] = useState<MedicalCategory | null>(null);
  const [viewMode, setViewMode] = useState<RecordsViewMode>("skeleton");
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);

  const visibleCategories = showIntake
    ? CATEGORIES
    : CATEGORIES.filter((c) => c.key !== "intake");

  const displayRecords = useMemo(
    () => (showIntake ? records : withoutIntakeRecords(records)),
    [records, showIntake],
  );

  const grouped = useMemo(() => {
    const out: Record<MedicalCategory, MedicalRecord[]> = {
      diagnosis: [],
      lab: [],
      xray: [],
      prescription: [],
      intake: [],
    };
    for (const r of displayRecords) out[r.category]?.push(r);
    return out;
  }, [displayRecords]);

  const filteredGrouped = useMemo(() => {
    const withBody: MedicalHistoryFilters = {
      ...filters,
      bodyPart: selectedBodyPart ?? filters.bodyPart,
    };
    const out = { ...grouped };
    for (const key of SEARCHABLE_CATEGORIES) {
      out[key] = filterMedicalRecords(grouped[key], withBody);
    }
    return out;
  }, [grouped, filters, selectedBodyPart]);

  const isFiltering = hasActiveFilters(filters) || !!selectedBodyPart;
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const dateLocale = localeTag(isRTL);

  const openRecord = (item: MedicalRecord) => {
    if (doctorView) {
      router.push({
        pathname: "/medical/[id]",
        params: { id: item.id, doctorView: "1", patientUserId },
      });
    } else {
      router.push(`/medical/${item.id}`);
    }
  };

  const openAdd = () => {
    router.push(
      buildMedicalAddHref(null, {
        patientUserId,
      }) as never,
    );
  };

  const handleSelectPart = (part: BodyPart | null) => {
    setSelectedBodyPart(part);
  };

  const recordsPanel = visibleCategories.map(({ key, labelEn, labelAr, Icon, color }) => {
    const label = isRTL ? labelAr : labelEn;
    const isOpen = openSection === key;
    const isSearchable = SEARCHABLE_CATEGORIES.includes(key);
    const allItems = grouped[key];
    const items = isSearchable ? filteredGrouped[key] : allItems;
    const sectionFiltering = isSearchable && isFiltering;

    return (
      <View
        key={key}
        style={[styles.categoryBlock, viewMode === "skeleton" && styles.categoryBlockSplit]}
      >
        <View
          style={[
            styles.categoryCard,
            {
              flexDirection: dir,
              backgroundColor: colors.card,
              borderColor: isOpen ? color : colors.border,
            },
          ]}
        >
          <Pressable
            onPress={() => setOpenSection((prev) => (prev === key ? null : key))}
            style={[styles.categoryTogglePart, { flexDirection: dir }]}
          >
            <View style={[styles.iconBubble, { backgroundColor: color + "22" }]}>
              <Icon size={16} color={color} />
            </View>
            <Text
              style={[
                styles.categoryLabel,
                { color: colors.foreground, textAlign },
              ]}
            >
              {label}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: color + "18" }]}>
              <Text style={[styles.categoryCount, { color }]}>
                {sectionFiltering ? `${items.length}/${allItems.length}` : allItems.length}
              </Text>
            </View>
            {isOpen ? (
              <ChevronUp size={16} color={color} />
            ) : (
              <ChevronDown size={16} color={colors.mutedForeground} />
            )}
          </Pressable>
        </View>

        {isOpen && (
          <>
            {allItems.length === 0 ? (
              <Text
                style={[
                  styles.emptyCat,
                  {
                    color: colors.mutedForeground,
                    borderColor: colors.border,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {isRTL ? "لا توجد إدخالات بعد" : "No entries yet"}
              </Text>
            ) : items.length === 0 ? (
              <Text
                style={[
                  styles.emptyCat,
                  {
                    color: colors.mutedForeground,
                    borderColor: colors.border,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {isRTL ? "لا توجد نتائج للبحث" : "No matches for your search"}
              </Text>
            ) : (
              <FlatList
                data={items}
                scrollEnabled={false}
                keyExtractor={(r) => r.id}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                renderItem={({ item }) => {
                  const isImg =
                    !!item.fileUrl &&
                    isMedicalImageAttachment(item.fileUrl, item.fileName);
                  return (
                    <View
                      style={[
                        styles.recordCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      {item.fileUrl && isImg && (
                        <Pressable onPress={() => setViewingFileUrl(item.fileUrl!)}>
                          <Image
                            source={{ uri: item.fileUrl }}
                            style={styles.recordThumb}
                            resizeMode="cover"
                          />
                        </Pressable>
                      )}
                      {item.fileUrl && !isImg && (
                        <Pressable
                          onPress={() => Linking.openURL(item.fileUrl!)}
                          style={[styles.recordPdfBox, { backgroundColor: colors.muted }]}
                        >
                          <FileText size={36} color={colors.primary} />
                          <Text style={[styles.recordPdfLabel, { color: colors.mutedForeground, textAlign }]}>
                            {item.fileName ?? (isRTL ? "عرض المستند" : "View document")}
                          </Text>
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => openRecord(item)}
                        style={({ pressed }) => [
                          styles.recordInfoRow,
                          { flexDirection: dir, backgroundColor: pressed ? colors.muted : "transparent" },
                        ]}
                      >
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            style={[
                              styles.recordTitle,
                              { color: colors.foreground, textAlign },
                            ]}
                          >
                            {item.title}
                          </Text>
                          {item.category === "diagnosis" && item.doctorName ? (
                            <Text
                              style={[
                                styles.recordValue,
                                { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                              ]}
                              numberOfLines={1}
                            >
                              {isRTL ? `د. ${item.doctorName}` : `Dr. ${item.doctorName}`}
                            </Text>
                          ) : null}
                          {item.bodyPart ? (
                            <Text
                              style={[
                                styles.bodyPartChip,
                                {
                                  color: colors.primary,
                                  backgroundColor: `${colors.primary}14`,
                                  alignSelf: isRTL ? "flex-end" : "flex-start",
                                },
                              ]}
                            >
                              {t.records.bodyParts[item.bodyPart]}
                            </Text>
                          ) : null}
                          {item.category === "diagnosis" && item.symptoms?.length ? (
                            <Text
                              style={[
                                styles.recordValue,
                                { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                              ]}
                              numberOfLines={1}
                            >
                              {item.symptoms.length}{" "}
                              {isRTL ? "عرض" : item.symptoms.length === 1 ? "symptom" : "symptoms"}
                            </Text>
                          ) : item.notes ? (
                            <Text
                              style={[
                                styles.recordValue,
                                { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                              ]}
                              numberOfLines={2}
                            >
                              {item.notes}
                            </Text>
                          ) : item.value ? (
                            <Text
                              style={[
                                styles.recordValue,
                                { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                              ]}
                            >
                              {item.value}
                            </Text>
                          ) : null}
                          <Text
                            style={[
                              styles.recordDate,
                              { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                            ]}
                          >
                            {new Date(item.date).toLocaleDateString(dateLocale)}
                          </Text>
                        </View>
                        <ChevronDown
                          size={16}
                          color={colors.mutedForeground}
                          style={{ transform: [{ rotate: isRTL ? "90deg" : "-90deg" }] }}
                        />
                      </Pressable>
                    </View>
                  );
                }}
              />
            )}
          </>
        )}
      </View>
    );
  });

  const splitHeight = bodyFigureViewportHeight(screenHeight, screenWidth);

  return (
    <>
      <View style={styles.viewToggleWrap}>
        <RecordsViewModeToggle mode={viewMode} onChange={setViewMode} />
      </View>

      {viewMode === "table" ? (
        <MedicalHistoryFilterPanel
          filters={filters}
          onChange={setFilters}
          isRTL={isRTL}
          dir={dir}
        />
      ) : null}

      {viewMode === "skeleton" ? (
        isDesktop ? (
          <View
            style={[
              styles.splitRow,
              {
                flexDirection: dir,
                height: splitHeight,
              },
            ]}
          >
            <View style={[styles.splitPane, styles.splitSkeleton, { borderColor: colors.border }]}>
              <BodySkeletonView
                selectedPart={selectedBodyPart}
                records={displayRecords}
                onSelectPart={handleSelectPart}
              />
            </View>
            <ScrollView
              style={[styles.splitPane, styles.splitRecords]}
              contentContainerStyle={styles.splitRecordsContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {recordsPanel}
            </ScrollView>
          </View>
        ) : (
          <View style={[styles.skeletonOnly, { height: splitHeight }]}>
            <BodySkeletonView
              selectedPart={selectedBodyPart}
              records={displayRecords}
              onSelectPart={handleSelectPart}
              onOpenPart={(part) => {
                router.push(
                  buildBodyPartRecordsHref(part, { patientUserId }) as never,
                );
              }}
            />
          </View>
        )
      ) : (
        recordsPanel
      )}

      {canAdd ? (
        <MedicalRecordAddBar onAdd={openAdd} showDiagnosis={doctorView} layout="inline" />
      ) : null}

      <Modal
        visible={!!viewingFileUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingFileUrl(null)}
        statusBarTranslucent
      >
        <View style={styles.viewerBackdrop}>
          <Pressable
            style={[styles.viewerClose, { top: insets.top + 12 }]}
            onPress={() => setViewingFileUrl(null)}
          >
            <X size={20} color="#fff" />
          </Pressable>
          {viewingFileUrl && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.viewerScroll}
              maximumZoomScale={4}
              minimumZoomScale={1}
              centerContent
            >
              <Image
                source={{ uri: viewingFileUrl }}
                style={{ width: screenWidth, height: screenHeight * 0.88 }}
                resizeMode="contain"
              />
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  viewToggleWrap: { paddingHorizontal: 16, paddingTop: 8 },
  splitRow: {
    marginTop: 8,
    marginHorizontal: 8,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  skeletonOnly: {
    marginTop: 8,
    marginHorizontal: 8,
    minHeight: 0,
  },
  splitPane: {
    minWidth: 0,
    minHeight: 0,
  },
  splitSkeleton: {
    flex: 4,
    borderRightWidth: StyleSheet.hairlineWidth,
    padding: 10,
    backgroundColor: "transparent",
  },
  splitRecords: {
    flex: 6,
  },
  splitRecordsContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  categoryBlock: { paddingHorizontal: 16, paddingTop: 10 },
  categoryBlockSplit: { paddingHorizontal: 8, paddingTop: 6 },
  categoryCard: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
    overflow: "hidden",
  },
  categoryTogglePart: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: { fontSize: 15, fontWeight: "700", flex: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  categoryCount: { fontSize: 12, fontWeight: "700" },
  emptyCat: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    fontSize: 13,
    marginBottom: 4,
  },
  recordCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  recordThumb: { width: "100%", height: 160 },
  recordPdfBox: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  recordPdfLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  recordInfoRow: { alignItems: "flex-start", gap: 10, padding: 14 },
  recordTitle: { fontSize: 15, fontWeight: "700" },
  recordValue: { fontSize: 13, marginTop: 2 },
  bodyPartChip: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  recordDate: { fontSize: 11, marginTop: 4 },
  viewerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  viewerClose: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerScroll: { flex: 1, alignItems: "center", justifyContent: "center" },
});
