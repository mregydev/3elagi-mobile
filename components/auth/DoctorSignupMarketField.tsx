import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  patientCountryLabel,
  type MarketCountryCode,
} from "@/constants/patientCountries";
import {
  getDoctorSignupMarket,
  setDoctorSignupMarketOverride,
} from "@/domains/market/doctorSignupMarket";
import {
  getMarketSiteUrl,
  navigateToMarketSite,
} from "@/domains/market/marketSiteUrl";
import { getUrlMarketCountry } from "@/domains/market/resolveMarketCountry";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { flexRow } from "@/utils/rtl";

const MARKETS: MarketCountryCode[] = ["EG", "JO"];

type Props = {
  isRTL: boolean;
  disabled?: boolean;
  error?: string;
  /** Called when market is resolved (URL or local pick). */
  onMarketChange?: (market: MarketCountryCode | null) => void;
};

function signupPathForMarket(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const path = window.location.pathname || "/welcome";
    return path.startsWith("/") ? path : `/${path}`;
  }
  return "/welcome";
}

function isLocalWebHost(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local")
  );
}

/**
 * Doctor practice country is locked to the URL market (egypt / jordan).
 * URLs without egypt/jordan must open the matching market site (web)
 * or pick locally (native).
 */
export function DoctorSignupMarketField({
  isRTL,
  disabled,
  error,
  onMarketChange,
}: Props) {
  const colors = useColors();
  const { t } = useI18n();
  const dir = flexRow(isRTL);
  const urlMarket = getUrlMarketCountry();
  const [localMarket, setLocalMarket] = useState<MarketCountryCode | null>(
    () => getDoctorSignupMarket(),
  );
  const market = urlMarket ?? localMarket;

  const applyLocalMarket = (code: MarketCountryCode) => {
    setDoctorSignupMarketOverride(code);
    setLocalMarket(code);
    onMarketChange?.(code);
  };

  const openMarketSite = (code: MarketCountryCode) => {
    const path = signupPathForMarket();
    if (isLocalWebHost()) {
      window.location.assign(getMarketSiteUrl(code, path));
      return;
    }
    navigateToMarketSite(code, path);
  };

  if (market) {
    return (
      <View style={styles.wrap}>
        <Text
          style={[
            styles.label,
            { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t.auth.countryOfPractice}
        </Text>
        <View
          style={[
            styles.lockedChip,
            {
              backgroundColor: `${colors.primary}18`,
              borderColor: colors.primary,
              alignSelf: isRTL ? "flex-end" : "flex-start",
            },
          ]}
        >
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
            {patientCountryLabel(market, isRTL)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text
        style={[
          styles.label,
          { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
        ]}
      >
        {t.auth.doctorMarketRequiredTitle}
      </Text>
      <Text
        style={[
          styles.sub,
          {
            color: colors.mutedForeground,
            textAlign: isRTL ? "right" : "left",
          },
        ]}
      >
        {t.auth.doctorMarketRequiredSubtitle}
      </Text>
      <View style={[styles.row, { flexDirection: dir }]}>
        {MARKETS.map((code) => (
          <Pressable
            key={code}
            disabled={disabled}
            onPress={() => {
              // Production web: must land on egypt/jordan URL — no override.
              if (Platform.OS === "web" && !isLocalWebHost()) {
                openMarketSite(code);
                return;
              }
              // Local web: rewrite URL with ?country= / subdomain.
              if (Platform.OS === "web" && isLocalWebHost()) {
                openMarketSite(code);
                return;
              }
              // Native: keep signup in-app with an explicit market pick.
              applyLocalMarket(code);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
                opacity: disabled ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={{
                color: colors.foreground,
                fontWeight: "700",
                fontSize: 13,
              }}
            >
              {patientCountryLabel(code, isRTL)}
            </Text>
          </Pressable>
        ))}
      </View>
      {error ? (
        <Text style={{ color: colors.destructive, fontSize: 12, fontWeight: "600" }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: "700" },
  sub: { fontSize: 13, lineHeight: 18 },
  row: { flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  lockedChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
