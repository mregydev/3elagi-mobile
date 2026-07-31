import { Redirect } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { MarketDoctorsBrowse } from "@/components/MarketDoctorsBrowse";
import {
  countryFlagEmoji,
  patientCountryLabel,
  type MarketCountryCode,
} from "@/constants/patientCountries";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import {
  isOnMarketHost,
  navigateToMarketSite,
} from "@/domains/market/marketSiteUrl";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { alignText, flexRow } from "@/utils/rtl";

const MARKETS: MarketCountryCode[] = ["EG", "JO"];

export default function OurDoctorsTab() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const showHeader = Platform.OS !== "web" || !isDesktop;
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const [selectedMarket, setSelectedMarket] = useState<MarketCountryCode | null>(
    null,
  );

  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  const marketCards = useMemo(
    () =>
      MARKETS.map((code) => ({
        code,
        flag: countryFlagEmoji(code),
        name: patientCountryLabel(code, isRTL),
      })),
    [isRTL],
  );

  const openMarket = (code: MarketCountryCode) => {
    const host =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.hostname
        : "";
    const isLocal =
      !host || host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");

    // Native / local / already on that market host → browse in-app.
    if (Platform.OS !== "web" || isLocal || isOnMarketHost(code)) {
      setSelectedMarket(code);
      return;
    }

    // Web: jump to egypt/jordan site URL and carry the session so login persists.
    navigateToMarketSite(code, "/");
  };

  if (!isSignedIn(profile, accessToken) || !role) {
    return <Redirect href="/welcome" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {showHeader ? <AppHeader /> : null}

      {selectedMarket ? (
        <View style={styles.body}>
          <Pressable
            onPress={() => setSelectedMarket(null)}
            style={[styles.backRow, { flexDirection: dir }]}
            hitSlop={8}
          >
            <Chevron size={18} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {t.tabs.ourDoctors}
            </Text>
          </Pressable>
          <MarketDoctorsBrowse marketCountry={selectedMarket} />
        </View>
      ) : (
        <View style={styles.landing}>
          <Text style={[styles.title, { color: colors.foreground, textAlign }]}>
            {t.tabs.ourDoctors}
          </Text>
          <Text
            style={[styles.subtitle, { color: colors.mutedForeground, textAlign }]}
          >
            {t.tabs.ourDoctorsSubtitle}
          </Text>

          <View style={styles.cards}>
            {marketCards.map(({ code, flag, name }) => (
              <Pressable
                key={code}
                onPress={() => openMarket(code)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    flexDirection: dir,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Text style={styles.cardFlag}>{flag}</Text>
                <View style={styles.cardCopy}>
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground, textAlign }]}
                  >
                    {isRTL ? `أطباء ${name}` : `Doctors from ${name}`}
                  </Text>
                  <Text
                    style={[
                      styles.cardHint,
                      { color: colors.mutedForeground, textAlign },
                    ]}
                  >
                    {t.tabs.ourDoctorsBrowseHint}
                  </Text>
                </View>
                <Chevron size={20} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  backRow: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  landing: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  cards: {
    gap: 12,
  },
  card: {
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardFlag: {
    fontSize: 36,
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  cardHint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
