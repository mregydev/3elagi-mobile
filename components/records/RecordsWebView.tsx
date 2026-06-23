import { router } from "expo-router";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  Search,
  Stethoscope,
  X,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import {
  MedicalRecordAddBar,
  MEDICAL_RECORD_ADD_BAR_HEIGHT,
} from "@/components/records/MedicalRecordAddBar";
import {
  getCategoryMeta,
  getDisplayMedicalRecordCategories,
  getLocalizedCategoryLabel,
  getRecordSubtitle,
  getRecordTimestamp,
  groupRecordsByMonth,
  withoutIntakeRecords,
} from "@/components/records/medicalRecordCategories";
import {
  EMPTY_MEDICAL_FILTERS,
  filterMedicalRecords,
  hasActiveFilters,
  type DateFilterMode,
  type MedicalHistoryFilters,
} from "@/domains/medical/search";
import type { MedicalCategory, MedicalRecord } from "@/domains/medical/types";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useRecordsPage } from "@/hooks/useRecordsPage";
import { useWebLayout } from "@/hooks/useWebLayout";
import { alignText, flexRow, localeTag } from "@/utils/rtl";

type CategoryFilter = MedicalCategory | "all";

const DATE_MODES: DateFilterMode[] = ["any", "on", "range", "before", "after"];

function parseWebDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatWebDate(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function RecordsWebView() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const tabBarHeight = useBottomTabBarHeight();
  const tabBarOffset = isDesktop ? 0 : tabBarHeight;
  const { records } = useRecordsPage();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const dateLocale = localeTag(isRTL);

  const [filters, setFilters] = useState<MedicalHistoryFilters>(EMPTY_MEDICAL_FILTERS);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const displayRecords = useMemo(() => withoutIntakeRecords(records), [records]);
  const visibleCategories = getDisplayMedicalRecordCategories();

  const filteredRecords = useMemo(() => {
    const filtered = filterMedicalRecords(displayRecords, filters);
    const scoped =
      categoryFilter === "all" ? filtered : filtered.filter((r) => r.category === categoryFilter);
    return [...scoped].sort((a, b) => getRecordTimestamp(b) - getRecordTimestamp(a));
  }, [displayRecords, filters, categoryFilter]);

  const timelineGroups = useMemo(
    () => groupRecordsByMonth(filteredRecords, dateLocale),
    [filteredRecords, dateLocale],
  );

  const filtering = hasActiveFilters(filters) || categoryFilter !== "all";
  const advancedFiltering =
    hasActiveFilters(filters) &&
    (filters.doctorName.trim().length > 0 ||
      filters.dateMode !== "any" ||
      filters.text.trim().length > 0);

  const openRecord = (item: MedicalRecord) => {
    router.push(`/medical/${item.id}`);
  };

  const openAdd = (category: MedicalCategory) => {
    router.push(`/medical/add?category=${category}`);
  };

  const setDateMode = (mode: DateFilterMode) => {
    setFilters({
      ...filters,
      dateMode: mode,
      ...(mode === "any"
        ? { dateFrom: null, dateTo: null, singleDate: null }
        : mode === "range"
          ? { singleDate: null }
          : { dateFrom: null, dateTo: null }),
    });
  };

  const clearFilters = () => {
    setFilters(EMPTY_MEDICAL_FILTERS);
    setCategoryFilter("all");
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          {
            paddingBottom: isDesktop
              ? 32
              : MEDICAL_RECORD_ADD_BAR_HEIGHT + tabBarOffset + 16,
          },
        ]}
      >
        <View style={[styles.container, { maxWidth: WEB_MAX_WIDTH.content }]}>
          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: colors.foreground, textAlign }]}>
              {t.records.title}
            </Text>
            <Text style={[styles.pageSubtitle, { color: colors.mutedForeground, textAlign }]}>
              {t.records.webSubtitle}
            </Text>
          </View>

          {isDesktop ? (
            <MedicalRecordAddBar onAdd={openAdd} layout="web-inline" />
          ) : null}

          <View style={styles.searchBlock}>
            <View
              style={[
                styles.searchRow,
                { flexDirection: dir, borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Search size={18} color={colors.mutedForeground} />
              <TextInput
                value={filters.text}
                onChangeText={(text) => setFilters({ ...filters, text })}
                placeholder={t.records.searchPlaceholder}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground, textAlign }]}
                accessibilityLabel={t.records.searchLabel}
              />
              {filters.text.length > 0 ? (
                <Pressable onPress={() => setFilters({ ...filters, text: "" })} hitSlop={8}>
                  <X size={16} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.categoryRow, { flexDirection: dir }]}
            >
              <CategoryChip
                label={t.records.all}
                active={categoryFilter === "all"}
                onPress={() => setCategoryFilter("all")}
                colors={colors}
                activeColor={colors.primary}
              />
              {visibleCategories.map(({ key, color }) => (
                <CategoryChip
                  key={key}
                  label={getLocalizedCategoryLabel(key, t)}
                  active={categoryFilter === key}
                  onPress={() => setCategoryFilter(key)}
                  colors={colors}
                  activeColor={color}
                />
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setFiltersOpen((v) => !v)}
              style={[styles.filtersToggle, { flexDirection: dir }]}
              accessibilityRole="button"
              accessibilityState={{ expanded: filtersOpen }}
            >
              <Text style={[styles.filtersToggleText, { color: colors.primary }]}>
                {t.records.filterOptions}
              </Text>
              {filtersOpen ? (
                <ChevronUp size={16} color={colors.primary} />
              ) : (
                <ChevronDown size={16} color={colors.primary} />
              )}
              {advancedFiltering && !filtersOpen ? (
                <View style={[styles.filterDot, { backgroundColor: colors.primary }]} />
              ) : null}
            </Pressable>

            {filtersOpen ? (
              <View style={[styles.advancedFilters, { borderColor: colors.border }]}>
                <View
                  style={[
                    styles.searchRow,
                    {
                      flexDirection: dir,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <Stethoscope size={16} color={colors.mutedForeground} />
                  <TextInput
                    value={filters.doctorName}
                    onChangeText={(doctorName) => setFilters({ ...filters, doctorName })}
                    placeholder={t.records.doctorName}
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.searchInput, { color: colors.foreground, textAlign }]}
                  />
                  {filters.doctorName.length > 0 ? (
                    <Pressable
                      onPress={() => setFilters({ ...filters, doctorName: "" })}
                      hitSlop={8}
                    >
                      <X size={16} color={colors.mutedForeground} />
                    </Pressable>
                  ) : null}
                </View>

                <View style={[styles.chipRow, { flexDirection: dir }]}>
                  {DATE_MODES.map((mode) => {
                    const active = filters.dateMode === mode;
                    return (
                      <Pressable
                        key={mode}
                        onPress={() => setDateMode(mode)}
                        style={[
                          styles.dateChip,
                          {
                            backgroundColor: active ? `${colors.primary}12` : "transparent",
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: active ? colors.primary : colors.foreground,
                            fontWeight: "600",
                            fontSize: 12,
                          }}
                        >
                          {t.records.dateFilter[mode]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {filters.dateMode === "range" ? (
                  <View style={[styles.dateRow, { flexDirection: dir }]}>
                    <DateInput
                      label={t.records.dateFrom}
                      value={filters.dateFrom}
                      onChange={(dateFrom) => setFilters({ ...filters, dateFrom })}
                      colors={colors}
                      isRTL={isRTL}
                      dir={dir}
                    />
                    <DateInput
                      label={t.records.dateTo}
                      value={filters.dateTo}
                      onChange={(dateTo) => setFilters({ ...filters, dateTo })}
                      colors={colors}
                      isRTL={isRTL}
                      dir={dir}
                    />
                  </View>
                ) : null}

                {(filters.dateMode === "on" ||
                  filters.dateMode === "before" ||
                  filters.dateMode === "after") && (
                  <DateInput
                    label={t.records.date}
                    value={filters.singleDate}
                    onChange={(singleDate) => setFilters({ ...filters, singleDate })}
                    colors={colors}
                    isRTL={isRTL}
                    dir={dir}
                  />
                )}
              </View>
            ) : null}

            {filtering ? (
              <Pressable onPress={clearFilters} style={styles.clearLink}>
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>
                  {t.records.clearFilters}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {filteredRecords.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ClipboardList size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, textAlign }]}>
                {displayRecords.length === 0 ? t.records.emptyTitle : t.records.emptyFilteredTitle}
              </Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground, textAlign }]}>
                {displayRecords.length === 0 ? t.records.emptyBody : t.records.emptyFilteredBody}
              </Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {timelineGroups.map((group) => (
                <View key={group.key} style={styles.timelineGroup}>
                  <Text style={[styles.monthLabel, { color: colors.mutedForeground, textAlign }]}>
                    {group.label}
                  </Text>
                  <View style={styles.timelineItems}>
                    {group.items.map((record, index) => (
                      <RecordTimelineItem
                        key={record.id}
                        record={record}
                        isLast={index === group.items.length - 1}
                        colors={colors}
                        isRTL={isRTL}
                        dir={dir}
                        textAlign={textAlign}
                        dateLocale={dateLocale}
                        onOpen={() => openRecord(record)}
                        categoryLabel={getLocalizedCategoryLabel(record.category, t)}
                        attachmentLabel={t.records.attachmentAvailable}
                        doctorPrefix={t.records.doctorPrefix}
                        symptomsRecordedOne={t.records.symptomsRecordedOne}
                        symptomsRecordedMany={t.records.symptomsRecordedMany}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

        </View>
      </ScrollView>

      {!isDesktop ? (
        <View style={[styles.webDock, { bottom: tabBarOffset }]}>
          <MedicalRecordAddBar onAdd={openAdd} layout="web-dock" />
        </View>
      ) : null}
    </View>
  );
}

function CategoryChip({
  label,
  active,
  onPress,
  colors,
  activeColor,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  activeColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.categoryChip,
        {
          backgroundColor: active ? `${activeColor}14` : colors.card,
          borderColor: active ? activeColor : colors.border,
        },
      ]}
    >
      <Text
        style={{
          color: active ? activeColor : colors.foreground,
          fontWeight: "700",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DateInput({
  label,
  value,
  onChange,
  colors,
  isRTL,
  dir,
}: {
  label: string;
  value: Date | null;
  onChange: (d: Date | null) => void;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
  dir: "row" | "row-reverse";
}) {
  const textAlign = alignText(isRTL);

  return (
    <View style={styles.dateField}>
      <Text style={[styles.dateLabel, { color: colors.mutedForeground, textAlign }]}>{label}</Text>
      <View
        style={[
          styles.dateInputRow,
          { flexDirection: dir, borderColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <TextInput
          value={formatWebDate(value)}
          onChangeText={(text) => onChange(parseWebDate(text))}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.dateInput, { color: colors.foreground, textAlign }]}
        />
        {value ? (
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <X size={14} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function RecordTimelineItem({
  record,
  isLast,
  colors,
  isRTL,
  dir,
  textAlign,
  dateLocale,
  onOpen,
  categoryLabel,
  attachmentLabel,
  doctorPrefix,
  symptomsRecordedOne,
  symptomsRecordedMany,
}: {
  record: MedicalRecord;
  isLast: boolean;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
  dir: "row" | "row-reverse";
  textAlign: "left" | "right";
  dateLocale: string;
  onOpen: () => void;
  categoryLabel: string;
  attachmentLabel: string;
  doctorPrefix: (name: string) => string;
  symptomsRecordedOne: string;
  symptomsRecordedMany: string;
}) {
  const meta = getCategoryMeta(record.category);
  const subtitle = getRecordSubtitle(record);
  const formattedDate = new Date(record.date).toLocaleDateString(dateLocale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <View style={[styles.timelineRow, { flexDirection: dir }]}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: meta.color, borderColor: colors.card }]} />
        {!isLast ? (
          <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
        ) : null}
      </View>

      <Pressable
        testID="records-row"
        onPress={onOpen}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          styles.recordCard,
          {
            backgroundColor: pressed ? colors.muted : colors.card,
            borderColor: colors.border,
            ...(isRTL
              ? { borderRightWidth: 3, borderRightColor: meta.color }
              : { borderLeftWidth: 3, borderLeftColor: meta.color }),
            transform: hovered ? [{ translateY: -1 }] : undefined,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={record.title}
      >
        <View style={[styles.recordCardTop, { flexDirection: dir }]}>
          <View style={[styles.typeBadge, { flexDirection: dir, backgroundColor: `${meta.color}14` }]}>
            <meta.Icon size={14} color={meta.color} />
            <Text style={[styles.typeBadgeText, { color: meta.color }]}>
              {categoryLabel}
            </Text>
          </View>
          <Text style={[styles.recordDate, { color: colors.mutedForeground }]}>{formattedDate}</Text>
        </View>

        <Text style={[styles.recordTitle, { color: colors.foreground, textAlign }]} numberOfLines={2}>
          {record.title}
        </Text>

        {record.category === "diagnosis" && record.doctorName ? (
          <Text style={[styles.recordMeta, { color: colors.mutedForeground, textAlign }]}>
            {doctorPrefix(record.doctorName)}
          </Text>
        ) : null}

        {record.category === "diagnosis" && record.symptoms?.length ? (
          <Text style={[styles.recordMeta, { color: colors.mutedForeground, textAlign }]}>
            {record.symptoms.length}{" "}
            {record.symptoms.length === 1 ? symptomsRecordedOne : symptomsRecordedMany}
          </Text>
        ) : null}

        {subtitle ? (
          <Text
            style={[styles.recordSnippet, { color: colors.mutedForeground, textAlign }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}

        {record.fileUrl ? (
          <View style={[styles.attachmentRow, { flexDirection: dir }]}>
            <FileText size={14} color={colors.primary} />
            <Text style={[styles.attachmentText, { color: colors.primary }]}>
              {attachmentLabel}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: 0, width: "100%", position: "relative" },
  webDock: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 100,
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  scrollContentDesktop: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 48,
  },
  container: {
    width: "100%",
    gap: 24,
  },
  pageHeader: {
    gap: 6,
    paddingHorizontal: 2,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 560,
  },
  searchBlock: {
    gap: 12,
  },
  searchRow: {
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minWidth: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    minWidth: 0,
  },
  categoryRow: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    cursor: "pointer" as "auto",
  },
  filtersToggle: {
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 2,
    cursor: "pointer" as "auto",
  },
  filtersToggleText: {
    fontSize: 13,
    fontWeight: "700",
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  advancedFilters: {
    gap: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chipRow: {
    flexWrap: "wrap",
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    cursor: "pointer" as "auto",
  },
  dateRow: {
    gap: 10,
  },
  dateField: {
    flex: 1,
    gap: 4,
    minWidth: 140,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  dateInputRow: {
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearLink: {
    alignSelf: "flex-start",
    paddingVertical: 2,
    cursor: "pointer" as "auto",
  },
  emptyState: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 36,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 360,
  },
  timeline: {
    gap: 28,
  },
  timelineGroup: {
    gap: 12,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    paddingHorizontal: 4,
  },
  timelineItems: {
    gap: 0,
  },
  timelineRow: {
    alignItems: "stretch",
    gap: 14,
  },
  timelineRail: {
    width: 20,
    alignItems: "center",
    paddingTop: 18,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    minHeight: 24,
  },
  recordCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    cursor: "pointer" as "auto",
  },
  recordCardTop: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  typeBadge: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  recordDate: {
    fontSize: 12,
    fontWeight: "600",
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  recordMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  recordSnippet: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  attachmentRow: {
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
