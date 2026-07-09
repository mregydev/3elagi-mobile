import { Check, Clock } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScheduleMonthGrid } from "@/components/schedule/ScheduleMonthGrid";
import { fetchMyAppointments } from "@/domains/appointments/api";
import {
  fetchMyScheduleOverrides,
  saveMyScheduleOverrides,
  type ScheduleOverrideRow,
} from "@/domains/schedule/api";
import {
  buildMonthGrid,
  calendarWeekStartsOn,
  DEFAULT_SLOT_MINUTES,
  isDateInPast,
} from "@/domains/schedule/calendar";
import { useColors } from "@/hooks/useColors";

interface Props {
  isRTL: boolean;
  token: string;
}

/** 30-minute time options for the from/to dropdowns. */
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h += 1) {
    for (let m = 0; m < 60; m += 30) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

function TimeSelect({
  label,
  value,
  onChange,
  isRTL,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isRTL: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.timeCol}>
      <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.timeBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
      >
        <Clock size={15} color={colors.primary} />
        <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 15 }}>{value}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.timeSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{label}</Text>
            <FlatList
              data={TIME_OPTIONS}
              keyExtractor={(t) => t}
              style={{ maxHeight: 320 }}
              getItemLayout={(_, i) => ({ length: 44, offset: 44 * i, index: i })}
              initialScrollIndex={Math.max(0, TIME_OPTIONS.indexOf(value))}
              renderItem={({ item }) => {
                const on = item === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                    style={[styles.timeOption, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                  >
                    <Text
                      style={{
                        color: on ? colors.primary : colors.foreground,
                        fontWeight: on ? "800" : "500",
                        fontSize: 15,
                      }}
                    >
                      {item}
                    </Text>
                    {on ? <Check size={16} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function DoctorAvailabilityEditor({ isRTL, token }: Props) {
  const colors = useColors();
  const now = useMemo(() => new Date(), []);
  const weekStartsOn = calendarWeekStartsOn(isRTL);

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<ScheduleOverrideRow[]>([]);
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const [fromTime, setFromTime] = useState("09:00");
  const [toTime, setToTime] = useState("17:00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ov, appts] = await Promise.all([
        fetchMyScheduleOverrides(token),
        fetchMyAppointments(token).catch(() => []),
      ]);
      setOverrides(ov);
      const booked = new Set<string>();
      for (const a of appts) {
        if (a.date && a.status !== "cancelled" && a.status !== "rejected") {
          booked.add(a.date);
        }
      }
      setBookedDates(booked);
    } catch {
      setOverrides([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  // Dates that already have an open (available) override — shown as a dot.
  const markedDates = useMemo(() => {
    const s = new Set<string>();
    for (const o of overrides) {
      if (o.start_date === o.end_date && !o.is_closed) s.add(o.start_date);
    }
    return s;
  }, [overrides]);

  const monthDays = useMemo(
    () =>
      buildMonthGrid(year, month, weekStartsOn)
        .flat()
        .filter((d): d is string => !!d && !isDateInPast(d)),
    [year, month, weekStartsOn],
  );
  const wholeMonthSelected =
    monthDays.length > 0 && monthDays.every((d) => selected.has(d));

  const goMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const toggleDate = (date: string) => {
    if (isDateInPast(date)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const toggleWholeMonth = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (wholeMonthSelected) monthDays.forEach((d) => next.delete(d));
      else monthDays.forEach((d) => next.add(d));
      return next;
    });
  };

  const persist = async () => {
    if (selected.size === 0) {
      Alert.alert(
        isRTL ? "لم يتم اختيار أيام" : "No days selected",
        isRTL ? "اختر يومًا أو أكثر من التقويم." : "Pick one or more days on the calendar.",
      );
      return;
    }
    if (toTime <= fromTime) {
      Alert.alert(
        isRTL ? "وقت غير صالح" : "Invalid time",
        isRTL ? "يجب أن يكون وقت النهاية بعد البداية." : "End time must be after start time.",
      );
      return;
    }
    setSaving(true);
    try {
      const fresh: ScheduleOverrideRow[] = Array.from(selected).map((date) => ({
        scope: "day",
        start_date: date,
        end_date: date,
        is_closed: false,
        start_time: fromTime,
        end_time: toTime,
        slot_minutes: DEFAULT_SLOT_MINUTES,
      }));
      const kept = overrides.filter(
        (o) => !(o.start_date === o.end_date && selected.has(o.start_date)),
      );
      const saved = await saveMyScheduleOverrides(token, [...kept, ...fresh]);
      setOverrides(saved);
      setSelected(new Set());
      Alert.alert(
        isRTL ? "تم الحفظ" : "Saved",
        isRTL
          ? `الأيام متاحة من ${fromTime} إلى ${toTime}.`
          : `Days available ${fromTime}–${toTime}.`,
      );
    } catch (e) {
      Alert.alert(isRTL ? "خطأ" : "Error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginVertical: 24 }} color={colors.primary} />;
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
        {isRTL ? "أوقات التوفر" : "Availability"}
      </Text>
      <Text style={[styles.hint, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {isRTL
          ? "اختر أيامًا من التقويم (يمكن اختيار عدة أيام أو شهور)، ثم حدّد وقت البداية والنهاية."
          : "Pick days on the calendar (across any months/years), then set a from/to time."}
      </Text>

      <Pressable
        onPress={toggleWholeMonth}
        disabled={monthDays.length === 0}
        style={[
          styles.wholeMonthBtn,
          {
            borderColor: wholeMonthSelected ? colors.primary : colors.border,
            backgroundColor: wholeMonthSelected ? `${colors.primary}14` : "transparent",
          },
        ]}
      >
        <Text
          style={{
            color: wholeMonthSelected ? colors.primary : colors.foreground,
            fontWeight: "700",
            fontSize: 13,
          }}
        >
          {wholeMonthSelected
            ? isRTL
              ? "إلغاء اختيار الشهر"
              : "Deselect month"
            : isRTL
              ? "اختيار الشهر كامل"
              : "Select whole month"}
        </Text>
      </Pressable>

      <ScheduleMonthGrid
        isRTL={isRTL}
        year={year}
        month={month}
        mode="week"
        selectedDate=""
        selectedWeekStart={`${year}-01-01`}
        selectedMonth={month}
        selectedYear={year}
        selectedDates={selected}
        markedDates={markedDates}
        bookedDates={bookedDates}
        onSelectDate={toggleDate}
        onPrevMonth={() => goMonth(-1)}
        onNextMonth={() => goMonth(1)}
      />

      <View style={[styles.legendRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {isRTL ? "متاح" : "Available"}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {isRTL ? "محجوز" : "Booked"}
          </Text>
        </View>
      </View>

      <View style={[styles.timeRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TimeSelect label={isRTL ? "من" : "From"} value={fromTime} onChange={setFromTime} isRTL={isRTL} colors={colors} />
        <TimeSelect label={isRTL ? "إلى" : "To"} value={toTime} onChange={setToTime} isRTL={isRTL} colors={colors} />
      </View>

      <Text style={[styles.selectedCount, { color: colors.mutedForeground }]}>
        {selected.size > 0
          ? isRTL
            ? `${selected.size} يوم مختار`
            : `${selected.size} day(s) selected`
          : isRTL
            ? "لم يتم اختيار أيام"
            : "No days selected"}
      </Text>

      <Pressable
        onPress={() => void persist()}
        disabled={saving}
        style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>{isRTL ? "حفظ كأيام متاحة" : "Save availability"}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
  },
  title: { fontSize: 16, fontWeight: "800" },
  hint: { fontSize: 13, lineHeight: 18 },
  wholeMonthBtn: {
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  legendRow: { gap: 16, marginTop: 2 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  timeRow: { gap: 12, marginTop: 8 },
  timeCol: { flex: 1, gap: 4 },
  timeLabel: { fontSize: 12, fontWeight: "700" },
  timeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectedCount: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  saveBtn: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  timeSheet: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    maxWidth: 360,
    width: "100%",
    alignSelf: "center",
  },
  sheetTitle: { fontSize: 15, fontWeight: "800" },
  timeOption: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    height: 44,
  },
});
