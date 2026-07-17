import { ArrowLeft, ArrowRight, Check, ChevronDown } from "lucide-react-native";
import { DoctorSubtitle, DoctorTrailingMeta } from "@/components/DoctorListMeta";
import { NameWithCountryFlag } from "@/components/NameWithCountryFlag";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Avatar } from "@/components/Avatar";
import type { Conversation } from "@/domains/chat/types";
import {
  DOCTOR_FILTER_COUNTRY_CODES,
  countryFlagEmoji,
  patientCountryLabel,
} from "@/constants/patientCountries";
import type { Speciality, SpecialityDoctor } from "@/domains/home/api";
import { doctorsToConversations } from "@/domains/home/doctorConversations";
import { usePresenceStore } from "@/domains/presence/store";
import { useColors } from "@/hooks/useColors";

function ConversationRow({
  item,
  colors,
  isRTL,
  onPress,
}: {
  item: Conversation;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
  onPress: () => void;
}) {
  const isOnline = usePresenceStore((s) => s.isOnline(item.user.id));
  const presence = isOnline ? "online" : "offline";
  const dir = isRTL ? "row-reverse" : "row";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { flexDirection: dir },
        pressed && { backgroundColor: colors.muted },
      ]}
    >
      <Avatar
        uri={item.user.photoUrl}
        seed={item.user.id}
        role="doctor"
        size={46}
        presence={presence}
      />

      <View style={[styles.content, { flexDirection: dir }]}>
        <View style={styles.mainCol}>
          <NameWithCountryFlag
            name={item.user.name}
            country={item.user.country}
            isRTL={isRTL}
            nameStyle={[
              styles.name,
              { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
          />
          <DoctorSubtitle specialty={item.user.specialty} isRTL={isRTL} />
        </View>

        <View style={[styles.trailingCol, { alignItems: isRTL ? "flex-start" : "flex-end" }]}>
          <DoctorTrailingMeta
            isRTL={isRTL}
            rating={item.user.rating}
            ratingTotal={item.user.ratingTotal}
            consultationPrice={item.user.consultationPrice}
            showReviewCount
          />
        </View>
      </View>
    </Pressable>
  );
}

interface Props {
  speciality: Speciality;
  doctors: SpecialityDoctor[];
  loading: boolean;
  isRTL: boolean;
  onBack: () => void;
  onSelectDoctor: (doctorUserId: string, doctorEntityId?: string) => void;
  hideHeaderBorder?: boolean;
}

export function DoctorChatRoster({
  speciality,
  doctors,
  loading,
  isRTL,
  onBack,
  onSelectDoctor,
  hideHeaderBorder = false,
}: Props) {
  const colors = useColors();
  const onlineUsers = usePresenceStore((s) => s.users);
  const dir = isRTL ? "row-reverse" : "row";
  const label = isRTL ? speciality.nameAr : speciality.nameEn;
  const backLabel = isRTL ? "التخصصات" : "Specialities";
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);

  const conversations = useMemo(
    () => doctorsToConversations(doctors),
    [doctors, onlineUsers],
  );

  const countryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of conversations) {
      const code = c.user.country?.trim().toUpperCase() || "EG";
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    return counts;
  }, [conversations]);

  const filtered = useMemo(() => {
    if (!countryFilter) return conversations;
    return conversations.filter(
      (c) => (c.user.country?.trim().toUpperCase() || "EG") === countryFilter,
    );
  }, [conversations, countryFilter]);

  const showCountryFilter = !loading && conversations.length > 0;

  const selectedCountryLabel = countryFilter
    ? `${countryFlagEmoji(countryFilter)}  ${patientCountryLabel(countryFilter, isRTL)}${
        (countryCounts.get(countryFilter) ?? 0) > 0
          ? ` (${countryCounts.get(countryFilter)})`
          : ""
      }`
    : isRTL
      ? `كل الدول (${conversations.length})`
      : `All countries (${conversations.length})`;

  const selectCountry = (code: string | null) => {
    setCountryFilter(code);
    setCountryMenuOpen(false);
  };

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          hideHeaderBorder && styles.headerBorderless,
        ]}
      >
        <Pressable
          onPress={onBack}
          style={[styles.backRow, { flexDirection: dir }]}
          hitSlop={8}
        >
          {isRTL ? (
            <ArrowRight size={20} color={colors.primary} />
          ) : (
            <ArrowLeft size={20} color={colors.primary} />
          )}
          <Text style={[styles.backText, { color: colors.primary }]}>
            {backLabel}
          </Text>
        </Pressable>
        <View
          style={[
            styles.titleRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Image
            source={require("@/assets/images/splash-mark.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title} numberOfLines={1}>
            {label}
          </Text>
        </View>

        {showCountryFilter ? (
          <View style={styles.filterBlock}>
            <Text
              style={[
                styles.filterLabel,
                { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {isRTL ? "تصفية حسب الدولة" : "Filter by country"}
            </Text>
            <Pressable
              onPress={() => setCountryMenuOpen(true)}
              style={[
                styles.dropdownTrigger,
                {
                  flexDirection: dir,
                  borderColor: countryFilter ? colors.primary : colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isRTL ? "تصفية حسب الدولة" : "Filter by country"}
            >
              <Text
                style={[
                  styles.dropdownValue,
                  {
                    color: colors.foreground,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                numberOfLines={1}
              >
                {selectedCountryLabel}
              </Text>
              <ChevronDown size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <Modal
        visible={countryMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryMenuOpen(false)}
      >
        <View style={styles.dropdownBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setCountryMenuOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={isRTL ? "إغلاق" : "Close"}
          />
          <View
            style={[
              styles.dropdownSheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.dropdownTitle,
                { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {isRTL ? "اختر الدولة" : "Select country"}
            </Text>
            <FlatList
              data={[
                { code: null as string | null, count: conversations.length },
                ...DOCTOR_FILTER_COUNTRY_CODES.map((code) => ({
                  code: code as string | null,
                  count: countryCounts.get(code) ?? 0,
                })),
              ]}
              keyExtractor={(item) => item.code ?? "all"}
              style={styles.dropdownList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = countryFilter === item.code;
                const flag = item.code ? countryFlagEmoji(item.code) : "";
                const labelText = item.code
                  ? patientCountryLabel(item.code, isRTL)
                  : isRTL
                    ? "كل الدول"
                    : "All countries";
                return (
                  <Pressable
                    onPress={() => selectCountry(item.code)}
                    style={[
                      styles.dropdownOption,
                      {
                        flexDirection: dir,
                        backgroundColor: active ? `${colors.primary}12` : "transparent",
                      },
                    ]}
                  >
                    <View style={[styles.dropdownOptionMain, { flexDirection: dir }]}>
                      {flag ? <Text style={styles.filterFlag}>{flag}</Text> : null}
                      <Text
                        style={{
                          color: active ? colors.primary : colors.foreground,
                          fontWeight: active ? "800" : "600",
                          fontSize: 14,
                          flexShrink: 1,
                        }}
                      >
                        {labelText}
                        {item.count > 0 ? ` (${item.count})` : ""}
                      </Text>
                    </View>
                    {active ? <Check size={16} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            {conversations.length === 0
              ? isRTL
                ? "لا يوجد أطباء في هذا التخصص"
                : "No doctors in this speciality"
              : isRTL
                ? "لا يوجد أطباء في هذه الدولة"
                : "No doctors in this country"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          extraData={onlineUsers}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => (
            <View
              style={[
                styles.divider,
                { backgroundColor: colors.border },
                isRTL ? { marginRight: 74, marginLeft: 0 } : { marginLeft: 74, marginRight: 0 },
              ]}
            />
          )}
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              colors={colors}
              isRTL={isRTL}
              onPress={() => onSelectDoctor(item.id, item.user.doctorEntityId)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  headerBorderless: {
    borderBottomWidth: 0,
  },
  backRow: {
    alignItems: "center",
    gap: 6,
  },
  titleRow: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
  },
  logo: { width: 26, height: 26 },
  backText: { fontSize: 14, fontWeight: "600" },
  title: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: "#1D4ED8",
    flexShrink: 1,
  },
  filterBlock: {
    marginTop: 12,
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  dropdownTrigger: {
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  dropdownSheet: {
    maxHeight: "70%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    paddingTop: 14,
    zIndex: 1,
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: "800",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  dropdownList: {
    maxHeight: 420,
  },
  dropdownOption: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownOptionMain: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  filterFlag: {
    fontSize: 16,
    lineHeight: 20,
  },
  row: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    alignItems: "flex-start",
    gap: 10,
  },
  mainCol: {
    flex: 1,
    minWidth: 0,
  },
  trailingCol: {
    gap: 4,
    paddingTop: 2,
  },
  name: { fontSize: 16, fontWeight: "600" },
  divider: { height: StyleSheet.hairlineWidth },
  empty: { alignItems: "center", paddingVertical: 60 },
});
