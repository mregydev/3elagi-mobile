import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { DoctorSubtitle, DoctorTrailingMeta } from "@/components/DoctorListMeta";
import { NameWithCountryFlag } from "@/components/NameWithCountryFlag";
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
import { Avatar } from "@/components/Avatar";
import type { Conversation } from "@/domains/chat/types";
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

/** Red = line busy, green = free to ring right now. Doctors with immediate calls on. */
function CallStateFlag({
  onCall,
  isRTL,
  colors,
}: {
  onCall: boolean;
  isRTL: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const { t } = useI18n();
  const tint = onCall ? "#ef4444" : colors.success;
  return (
    <View
      style={[
        styles.flag,
        {
          flexDirection: isRTL ? "row-reverse" : "row",
          alignSelf: isRTL ? "flex-end" : "flex-start",
          backgroundColor: `${tint}1A`,
        },
      ]}
    >
      <View style={[styles.flagDot, { backgroundColor: tint }]} />
      <Text style={[styles.flagText, { color: tint }]}>
        {onCall ? t.auth.doctorOnCall : t.auth.doctorAvailableNow}
      </Text>
    </View>
  );
}

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
  // Socket wins when it has spoken about this doctor; otherwise the fetched flag.
  const liveBusy = usePresenceStore((s) => s.busyDoctors[item.user.id]);
  const onCall = liveBusy ?? !!item.user.onCall;

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
          {/* Offline doctors can't be rung at all, so no availability flag. */}
          {item.user.immediateCallEnabled && isOnline ? (
            <CallStateFlag onCall={onCall} isRTL={isRTL} colors={colors} />
          ) : null}
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
  const { locale } = useI18n();
  const onlineUsers = usePresenceStore((s) => s.users);
  // Every market is listed by default; country is a filter the user opts into.
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
  flag: {
    marginTop: 4,
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  flagDot: { width: 7, height: 7, borderRadius: 3.5 },
  flagText: { fontSize: 11, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth },
  empty: { alignItems: "center", paddingVertical: 60 },
});
