import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { DoctorBrowseCard } from "@/components/home/DoctorBrowseCard";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  MARKET_COUNTRY_CODES,
  patientCountryLabel,
  type MarketCountryCode,
} from "@/constants/patientCountries";
import { CircledCountryFlag } from "@/components/country/CircledCountryFlag";
import type { Speciality, SpecialityDoctor } from "@/domains/home/api";
import { doctorsToConversations } from "@/domains/home/doctorConversations";
import { specialityLabel } from "@/domains/home/specialityLabel";
import { usePresenceStore } from "@/domains/presence/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

/** Country filter pill — doctors are listed from every market now. */
function CountryChip({
  active,
  label,
  country,
  colors,
  isRTL = false,
  onPress,
}: {
  active: boolean;
  label: string;
  country?: MarketCountryCode;
  colors: ReturnType<typeof useColors>;
  isRTL?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        {
          flexDirection: isRTL ? "row-reverse" : "row",
          backgroundColor: active ? `${colors.primary}14` : colors.card,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      {country ? <CircledCountryFlag country={country} size={16} /> : null}
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.primary : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
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
  onStartConsultation: (doctorUserId: string, doctorEntityId?: string) => void;
  hideHeaderBorder?: boolean;
}

export function DoctorChatRoster({
  speciality,
  doctors,
  loading,
  isRTL,
  onBack,
  onSelectDoctor,
  onStartConsultation,
  hideHeaderBorder = false,
}: Props) {
  const colors = useColors();
  const { locale } = useI18n();
  const onlineUsers = usePresenceStore((s) => s.users);
  const [countryFilter, setCountryFilter] = useState<MarketCountryCode | "all">(
    "all",
  );
  const dir = isRTL ? "row-reverse" : "row";
  const label = specialityLabel(speciality, locale);
  const backLabel =
    locale === "ar"
      ? "التخصصات"
      : locale === "de"
        ? "Fachgebiete"
        : locale === "es"
          ? "Especialidades"
          : "Specialities";

  const conversations = useMemo(
    () => doctorsToConversations(doctors),
    [doctors, onlineUsers],
  );

  const filtered = useMemo(
    () =>
      countryFilter === "all"
        ? conversations
        : conversations.filter(
            (c) =>
              (c.user.country?.trim().toUpperCase() || "EG") === countryFilter,
          ),
    [conversations, countryFilter],
  );

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
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
            style={[styles.logo, { tintColor: colors.primary }]}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.primary }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
          {filtered.length}{" "}
          {filtered.length === 1
            ? locale === "ar"
              ? "طبيب"
              : "doctor"
            : locale === "ar"
              ? "أطباء"
              : "doctors"}
        </Text>

        {!loading ? (
          <View
            style={[
              styles.filterRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <CountryChip
              active={countryFilter === "all"}
              label={isRTL ? "كل الدول" : "All countries"}
              colors={colors}
              onPress={() => setCountryFilter("all")}
            />
            {MARKET_COUNTRY_CODES.map((code) => (
              <CountryChip
                key={code}
                active={countryFilter === code}
                label={patientCountryLabel(code, isRTL)}
                country={code}
                colors={colors}
                isRTL={isRTL}
                onPress={() => setCountryFilter(code)}
              />
            ))}
          </View>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            {countryFilter === "all"
              ? isRTL
                ? "لا يوجد أطباء لهذا التخصص"
                : "No doctors for this speciality"
              : isRTL
                ? "لا يوجد أطباء في هذه الدولة لهذا التخصص"
                : "No doctors in this country for this speciality"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          extraData={onlineUsers}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <DoctorBrowseCard
              item={item}
              isRTL={isRTL}
              onViewProfile={() =>
                onSelectDoctor(item.id, item.user.doctorEntityId)
              }
              onStartConsultation={() =>
                onStartConsultation(item.id, item.user.doctorEntityId)
              }
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
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  countLabel: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 4,
  },
  filterRow: {
    marginTop: 12,
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "700" },
  listContent: {
    paddingTop: 6,
    paddingBottom: 16,
    gap: 6,
  },
  empty: { alignItems: "center", paddingVertical: 60 },
});
