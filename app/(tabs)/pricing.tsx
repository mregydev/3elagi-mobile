import { Coins, Stethoscope, Wallet } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { useAuthStore } from "@/domains/auth/store";
import { fetchPointPricing, type PointPricing } from "@/domains/points/api";
import {
  marketCurrencyCode,
  pricePerPoint,
} from "@/constants/patientCountries";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { alignText, flexRow } from "@/utils/rtl";

/** Public pricing page — the per-credit rate for wherever the visitor is. */
export default function PricingTab() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const textAlign = alignText(isRTL);
  const dir = flexRow(isRTL);
  const profile = useAuthStore((s) => s.profile);
  const [pricing, setPricing] = useState<PointPricing | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchPointPricing().then((next) => {
      if (!cancelled && next) setPricing(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rate = pricing?.pricePerPoint ?? pricePerPoint(profile?.country);
  const currency = pricing?.currency ?? marketCurrencyCode(profile?.country);

  const notes = [
    { Icon: Stethoscope, text: t.pricing.setByDoctor },
    { Icon: Wallet, text: t.pricing.payAsYouGo },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.foreground, textAlign }]}>
          {t.pricing.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign }]}>
          {t.pricing.subtitle}
        </Text>

        <View
          style={[
            styles.rateCard,
            { backgroundColor: colors.card, borderColor: colors.primary },
          ]}
        >
          <Coins size={26} color={colors.primary} />
          <Text style={[styles.rateValue, { color: colors.primary }]}>
            {t.credits.pricePerPointLabel(rate, currency)}
          </Text>
          <Text style={[styles.rateHint, { color: colors.mutedForeground }]}>
            {t.pricing.locationHint}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {notes.map(({ Icon, text }) => (
            <View key={text} style={[styles.noteRow, { flexDirection: dir }]}>
              <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}14` }]}>
                <Icon size={18} color={colors.primary} />
              </View>
              <Text style={[styles.noteText, { color: colors.foreground, textAlign }]}>
                {text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 14 },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { fontSize: 15, lineHeight: 22 },
  rateCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  rateValue: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  rateHint: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  noteRow: { alignItems: "center", gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: "600" },
});
