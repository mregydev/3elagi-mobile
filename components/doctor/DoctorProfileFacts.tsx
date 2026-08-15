import { Coins, Star } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CircledCountryFlag } from "@/components/country/CircledCountryFlag";
import { DoctorAvailabilityBadge } from "@/components/doctor/DoctorAvailabilityBadge";
import { cardShell, UI } from "@/constants/uiTokens";
import { patientCountryLabel, type MarketCountryCode } from "@/constants/patientCountries";
import { chatRepository } from "@/domains/chat/repository";
import type { PublicDoctorProfile } from "@/domains/doctor/api";
import { usePresenceStore } from "@/domains/presence/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { formatEgpPerUnit } from "@/utils/credits";
import { flexRow } from "@/utils/rtl";

type Props = {
  doctor: PublicDoctorProfile;
  userId?: string;
  specialtyLabel: string;
  ratingAvg: number;
  ratingTotal: number;
};

function FactCell({
  label,
  children,
  isRTL,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  isRTL: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.cell, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <Text style={[styles.cellLabel, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

export function DoctorProfileFacts({
  doctor,
  userId,
  specialtyLabel,
  ratingAvg,
  ratingTotal,
}: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const chatUserId = userId ?? doctor.userId;
  const cached = chatRepository.getUser(chatUserId);
  const country = cached?.country?.trim().toUpperCase() ?? "";
  const isOnline = usePresenceStore((s) => s.isOnline(chatUserId));
  const liveBusy = usePresenceStore((s) => s.busyDoctors[chatUserId]);
  const onCall = liveBusy ?? !!cached?.onCall;
  const hasRating = ratingAvg > 0;
  const languages = doctor.tags.filter(Boolean);

  return (
    <View style={[styles.grid, cardShell(colors.border, colors.card), { flexDirection: dir }]}>
      {specialtyLabel ? (
        <FactCell label={t.home.specialty} isRTL={isRTL} colors={colors}>
          <Text style={[styles.cellValue, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
            {specialtyLabel}
          </Text>
        </FactCell>
      ) : null}

      {doctor.experienceYears != null && doctor.experienceYears > 0 ? (
        <FactCell label={t.home.experience} isRTL={isRTL} colors={colors}>
          <Text style={[styles.cellValue, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
            {t.home.yearsExperience(doctor.experienceYears)}
          </Text>
        </FactCell>
      ) : null}

      {country && /^[A-Z]{2}$/.test(country) ? (
        <FactCell label={t.home.country} isRTL={isRTL} colors={colors}>
          <View style={[styles.inline, { flexDirection: dir }]}>
            <CircledCountryFlag country={country as MarketCountryCode} size={16} />
            <Text style={[styles.cellValue, { color: colors.foreground }]}>
              {patientCountryLabel(country as MarketCountryCode, isRTL)}
            </Text>
          </View>
        </FactCell>
      ) : null}

      <FactCell label={t.home.availability} isRTL={isRTL} colors={colors}>
        <DoctorAvailabilityBadge
          online={isOnline}
          onCall={onCall}
          immediateCallEnabled={!!cached?.immediateCallEnabled}
        />
      </FactCell>

      <FactCell label={t.home.rating} isRTL={isRTL} colors={colors}>
        <View style={[styles.inline, { flexDirection: dir }]}>
          <Star size={13} color={colors.warning} fill={hasRating ? colors.warning : "transparent"} />
          <Text style={[styles.cellValue, { color: colors.foreground }]}>
            {hasRating ? ratingAvg.toFixed(1) : t.doctor.new}
            {hasRating && ratingTotal > 0 ? ` · ${ratingTotal} ${t.doctor.reviews}` : ""}
          </Text>
        </View>
      </FactCell>

      <FactCell label={t.home.consultationCost} isRTL={isRTL} colors={colors}>
        <View style={[styles.inline, { flexDirection: dir }]}>
          <Coins size={13} color={colors.primary} />
          <Text style={[styles.cellValue, { color: colors.primary, fontWeight: "800" }]}>
            {formatEgpPerUnit(doctor.consultationPrice, t)}
          </Text>
        </View>
      </FactCell>

      {languages.length > 0 ? (
        <View style={[styles.languagesCell, { borderColor: colors.border }]}>
          <Text style={[styles.cellLabel, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
            {t.home.languages}
          </Text>
          <View style={[styles.tagRow, { flexDirection: dir }]}>
            {languages.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}25` }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexWrap: "wrap",
    gap: UI.space.sm,
    padding: UI.space.md,
  },
  cell: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 130,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  languagesCell: {
    width: "100%",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: UI.space.sm,
    gap: 6,
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  cellValue: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  inline: {
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  tagRow: {
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
