import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Calendar, X } from "lucide-react-native";
import { ScheduleMonthGrid } from "@/components/schedule/ScheduleMonthGrid";
import { bookChatAppointment } from "@/domains/appointments/api";
import { fetchDoctorSlots, formatDateYmd, type DoctorSlot } from "@/domains/schedule/api";
import {
  BOOKING_HORIZON_DAYS,
  isDateBeyond,
  isDateInPast,
  parseYmd,
} from "@/domains/schedule/calendar";
import { useColors } from "@/hooks/useColors";
import { chatFlexRow } from "@/utils/rtl";

interface Props {
  visible: boolean;
  isRTL: boolean;
  token: string;
  selfId: string;
  doctorUserId: string;
  doctorEntityId: string;
  onClose: () => void;
  onBooked: () => void;
}

export function BookAppointmentDialog({
  visible,
  isRTL,
  token,
  doctorUserId,
  doctorEntityId,
  onClose,
  onBooked,
}: Props) {
  const colors = useColors();
  const dir = chatFlexRow();
  const today = useMemo(() => new Date(), []);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(formatDateYmd(today));
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const now = formatDateYmd(new Date());
    setSelectedDate(now);
    const parsed = parseYmd(now);
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
  }, [visible]);

  const loadSlots = useCallback(async () => {
    if (!doctorEntityId || !selectedDate) return;
    if (isDateInPast(selectedDate) || isDateBeyond(selectedDate, BOOKING_HORIZON_DAYS)) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setError(null);
    try {
      const rows = await fetchDoctorSlots(doctorEntityId, selectedDate);
      setSlots(rows.filter((s) => !s.taken));
      setSelectedTime(null);
    } catch (e) {
      setSlots([]);
      setError((e as Error).message);
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorEntityId, selectedDate]);

  useEffect(() => {
    if (!visible) return;
    void loadSlots();
  }, [visible, loadSlots]);

  const handleSelectDate = (date: string) => {
    if (isDateInPast(date) || isDateBeyond(date, BOOKING_HORIZON_DAYS)) return;
    setSelectedDate(date);
    const parsed = parseYmd(date);
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
  };

  const selectedLabel = parseYmd(selectedDate).toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleBook = async () => {
    if (!selectedTime || booking) return;
    setBooking(true);
    setError(null);
    try {
      await bookChatAppointment(token, doctorUserId, selectedDate, selectedTime);
      onBooked();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBooking(false);
    }
  };

  const { width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === "web";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...(isWeb ? { width: screenWidth * 0.25, alignSelf: "center" } : {}),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={[styles.header, { flexDirection: dir }]}>
              <View style={[styles.titleRow, { flexDirection: dir }]}>
                <Calendar size={20} color={colors.primary} />
                <Text style={[styles.title, { color: colors.foreground }]}>
                  {isRTL ? "حجز موعد" : "Book appointment"}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "اختر اليوم من التقويم" : "Pick a day on the calendar"}
            </Text>

            <ScheduleMonthGrid
              isRTL={isRTL}
              year={viewYear}
              month={viewMonth}
              mode="month"
              singleDaySelection
              selectedDate={selectedDate}
              selectedWeekStart={selectedDate}
              selectedMonth={viewMonth}
              selectedYear={viewYear}
              onSelectDate={handleSelectDate}
              onPrevMonth={() => {
                const next = new Date(viewYear, viewMonth - 1, 1);
                setViewYear(next.getFullYear());
                setViewMonth(next.getMonth());
              }}
              onNextMonth={() => {
                const next = new Date(viewYear, viewMonth + 1, 1);
                setViewYear(next.getFullYear());
                setViewMonth(next.getMonth());
              }}
            />

            <Text style={[styles.selectedDay, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {selectedLabel}
            </Text>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "الأوقات المتاحة" : "Available times"}
            </Text>

            {loadingSlots ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : slots.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, textAlign: "center", marginVertical: 16 }}>
                {isRTL
                  ? "لا توجد أوقات متاحة لهذا اليوم — جرّب يومًا آخر"
                  : "No available times for this day — try another date"}
              </Text>
            ) : (
              <View style={[styles.slotGrid, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                {slots.map((slot) => {
                  const active = selectedTime === slot.time;
                  return (
                    <Pressable
                      key={slot.time}
                      onPress={() => setSelectedTime(slot.time)}
                      style={[
                        styles.slotChip,
                        {
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? `${colors.primary}18` : colors.background,
                        },
                      ]}
                    >
                      <Text style={{ color: active ? colors.primary : colors.foreground, fontWeight: "600" }}>
                        {slot.time}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {error ? (
              <Text style={{ color: colors.destructive, marginTop: 8, textAlign: "center" }}>{error}</Text>
            ) : null}

            <Pressable
              onPress={() => void handleBook()}
              disabled={!selectedTime || booking}
              style={[
                styles.bookBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !selectedTime || booking ? 0.55 : 1,
                },
              ]}
            >
              {booking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bookBtnText}>
                  {isRTL ? "إرسال طلب الحجز" : "Send booking request"}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    maxHeight: "90%",
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  titleRow: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 8,
  },
  selectedDay: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 4,
  },
  slotGrid: {
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 72,
    alignItems: "center",
  },
  bookBtn: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  bookBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
