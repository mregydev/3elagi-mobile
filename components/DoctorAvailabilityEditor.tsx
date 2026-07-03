import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RotateCcw } from "lucide-react-native";
import {
  DAY_LABELS_AR,
  DAY_LABELS_EN,
  defaultWeekRows,
  fetchMySchedule,
  mergeScheduleRows,
  saveMySchedule,
  type DoctorScheduleRow,
} from "@/domains/schedule/api";
import {
  ALL_30_MIN_SLOTS,
  DEFAULT_SLOT_MINUTES,
} from "@/domains/schedule/calendar";
import { useColors } from "@/hooks/useColors";

interface Props {
  isRTL: boolean;
  token: string;
}

function slotsInRange(start: string, end: string): Set<string> {
  const set = new Set<string>();
  const a = ALL_30_MIN_SLOTS.indexOf(start);
  const b = ALL_30_MIN_SLOTS.indexOf(end);
  if (a < 0 || b < 0) return set;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  for (let i = lo; i <= hi; i++) set.add(ALL_30_MIN_SLOTS[i]);
  return set;
}

function rangeFromSlots(selected: Set<string>): { start: string; end: string } {
  const sorted = Array.from(selected).sort();
  if (sorted.length === 0) return { start: "09:00", end: "17:00" };
  return { start: sorted[0], end: sorted[sorted.length - 1] };
}

function TimeSlotGrid({
  selected,
  onToggle,
  colors,
  isRTL,
}: {
  selected: Set<string>;
  onToggle: (slot: string) => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  isRTL: boolean;
}) {
  return (
    <View style={[tStyles.grid, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
      {ALL_30_MIN_SLOTS.map((slot) => {
        const active = selected.has(slot);
        return (
          <Pressable
            key={slot}
            onPress={() => onToggle(slot)}
            style={[
              tStyles.chip,
              {
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? `${colors.primary}18` : colors.background,
              },
            ]}
          >
            <Text
              style={{
                color: active ? colors.primary : colors.foreground,
                fontWeight: active ? "700" : "500",
                fontSize: 11,
              }}
            >
              {slot}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const tStyles = StyleSheet.create({
  grid: { flexWrap: "wrap", gap: 4 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 52,
    alignItems: "center",
  },
});

export function DoctorAvailabilityEditor({ isRTL, token }: Props) {
  const colors = useColors();
  const dayLabels = isRTL ? DAY_LABELS_AR : DAY_LABELS_EN;

  const [weeklyRows, setWeeklyRows] = useState<DoctorScheduleRow[]>(defaultWeekRows());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedDays, setSelectedDays] = useState<Set<number>>(() => new Set([1, 2, 3, 4, 5]));
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    () => slotsInRange("09:00", "16:30"),
  );

  const lastTappedSlot = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const schedule = await fetchMySchedule(token);
      const merged = mergeScheduleRows(schedule);
      setWeeklyRows(merged);

      const activeDays = new Set<number>();
      for (const row of merged) {
        if (row.is_active) activeDays.add(row.day_of_week);
      }
      setSelectedDays(activeDays);

      const first = merged.find((r) => r.is_active);
      if (first) {
        const endIdx = ALL_30_MIN_SLOTS.indexOf(first.end_time.slice(0, 5));
        setSelectedSlots(
          slotsInRange(
            first.start_time.slice(0, 5),
            endIdx > 0 ? ALL_30_MIN_SLOTS[endIdx - 1] : first.end_time.slice(0, 5),
          ),
        );
      }
    } catch (e) {
      Alert.alert(isRTL ? "خطأ" : "Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [isRTL, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) => {
      const alreadySelected = prev.has(slot);

      if (!alreadySelected && lastTappedSlot.current && prev.has(lastTappedSlot.current)) {
        const range = slotsInRange(lastTappedSlot.current, slot);
        const next = new Set(prev);
        for (const s of range) next.add(s);
        lastTappedSlot.current = slot;
        return next;
      }

      const next = new Set(prev);
      if (alreadySelected) {
        next.delete(slot);
        lastTappedSlot.current = null;
      } else {
        next.add(slot);
        lastTappedSlot.current = slot;
      }
      return next;
    });
  };

  const resetSlots = () => {
    setSelectedSlots(new Set());
    lastTappedSlot.current = null;
  };

  const save = async () => {
    setSaving(true);
    try {
      const range = rangeFromSlots(selectedSlots);
      const nextEndIdx = ALL_30_MIN_SLOTS.indexOf(range.end) + 1;
      const endTime =
        nextEndIdx < ALL_30_MIN_SLOTS.length
          ? ALL_30_MIN_SLOTS[nextEndIdx]
          : "24:00";
      const items: DoctorScheduleRow[] = Array.from({ length: 7 }, (_, day) => ({
        day_of_week: day,
        start_time: range.start,
        end_time: endTime,
        slot_minutes: DEFAULT_SLOT_MINUTES,
        is_active: selectedDays.has(day),
      }));
      const saved = await saveMySchedule(token, items);
      setWeeklyRows(mergeScheduleRows(saved));
      Alert.alert(
        isRTL ? "تم الحفظ" : "Saved",
        isRTL
          ? "الجدول الأسبوعي محدّث — يتكرر كل أسبوع."
          : "Weekly schedule updated — repeats every week.",
      );
    } catch (e) {
      Alert.alert(isRTL ? "خطأ" : "Error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = selectedSlots.size;
  const summaryLabel = useMemo(() => {
    if (selectedCount === 0) return isRTL ? "لم يتم اختيار أوقات" : "No slots selected";
    const r = rangeFromSlots(selectedSlots);
    return isRTL
      ? `${selectedCount} فترة (${r.start} – ${r.end})`
      : `${selectedCount} slots (${r.start} – ${r.end})`;
  }, [selectedCount, selectedSlots, isRTL]);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />;
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
        {isRTL ? "جدول التوفر" : "Availability schedule"}
      </Text>
      <Text style={[styles.hint, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {isRTL
          ? "اختر الأيام ثم اضغط على وقتين لتحديد نطاق، أو اضغط على كل وقت. كل فترة ٣٠ دقيقة."
          : "Pick days, then tap two slots to select a range, or tap individually. Each slot is 30 min."}
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
        {isRTL ? "الأيام" : "Days"}
      </Text>
      <View style={[styles.dayChipsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        {dayLabels.map((label, day) => {
          const active = selectedDays.has(day);
          return (
            <Pressable
              key={day}
              onPress={() => toggleDay(day)}
              style={[
                styles.dayChip,
                {
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? `${colors.primary}18` : colors.background,
                },
              ]}
            >
              <Text style={{ color: active ? colors.primary : colors.foreground, fontWeight: "700", fontSize: 13 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.slotHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {isRTL ? "أوقات التوفر" : "Time slots"}
        </Text>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {summaryLabel}
          </Text>
          {selectedCount > 0 && (
            <Pressable
              onPress={resetSlots}
              hitSlop={8}
              style={[styles.resetBtn, { borderColor: colors.border }]}
            >
              <RotateCcw size={14} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "600" }}>
                {isRTL ? "مسح" : "Reset"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
        <TimeSlotGrid selected={selectedSlots} onToggle={toggleSlot} colors={colors} isRTL={isRTL} />
      </ScrollView>

      <Pressable
        onPress={() => void save()}
        disabled={saving}
        style={[styles.btn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>
            {isRTL ? "حفظ الجدول" : "Save schedule"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  title: { fontSize: 17, fontWeight: "800" },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  hint: { fontSize: 13, lineHeight: 18 },
  dayChipsRow: { flexWrap: "wrap", gap: 6 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  slotHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 4,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  btn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800" },
});
