import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { DoctorSubtitle, DoctorTrailingMeta } from "@/components/DoctorListMeta";
import { NameWithCountryFlag } from "@/components/NameWithCountryFlag";
import React, { useMemo } from "react";
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
  countryFlagEmoji,
  normalizeMarketCountry,
  patientCountryLabel,
} from "@/constants/patientCountries";
import type { Speciality, SpecialityDoctor } from "@/domains/home/api";
import { doctorsToConversations } from "@/domains/home/doctorConversations";
import { useAuthStore } from "@/domains/auth/store";
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
  const profileCountry = useAuthStore((s) => s.profile?.country);
  const marketCountry = normalizeMarketCountry(profileCountry);
  const dir = isRTL ? "row-reverse" : "row";
  const label = isRTL ? speciality.nameAr : speciality.nameEn;
  const backLabel = isRTL ? "التخصصات" : "Specialities";

  const conversations = useMemo(
    () => doctorsToConversations(doctors),
    [doctors, onlineUsers],
  );

  const filtered = useMemo(
    () =>
      conversations.filter(
        (c) =>
          (c.user.country?.trim().toUpperCase() || "EG") === marketCountry,
      ),
    [conversations, marketCountry],
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
          <Text
            style={[
              styles.marketHint,
              { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {countryFlagEmoji(marketCountry)}{" "}
            {patientCountryLabel(marketCountry, isRTL)}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            {isRTL
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
  marketHint: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
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
