import { router } from "expo-router";
import { ArrowLeft, ArrowRight, Coins } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  PaymentMethodCard,
  type PaymentMethodId,
} from "@/components/points/PaymentMethodCard";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { showErrorToast } from "@/utils/toast";
import { flexRow } from "@/utils/rtl";

interface PointsCheckoutViewProps {
  amount: number;
  desktopLayout?: boolean;
}

export function PointsCheckoutView({ amount, desktopLayout = false }: PointsCheckoutViewProps) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const useWideLayout = desktopLayout || isDesktop;
  const dir = flexRow(isRTL);
  const textAlign = isRTL ? "right" : "left";
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const methods: Array<{
    id: PaymentMethodId;
    label: string;
    subtitle: string;
  }> = [
    {
      id: "vodafone_cash",
      label: t.credits.vodafoneCash,
      subtitle: t.credits.vodafoneCashHint,
    },
    {
      id: "fawry",
      label: t.credits.fawry,
      subtitle: t.credits.fawryHint,
    },
    {
      id: "credit_card",
      label: t.credits.creditCard,
      subtitle: t.credits.creditCardHint,
    },
  ];

  const handlePayment = (_method: PaymentMethodId) => {
    showErrorToast(t.credits.paymentNotImplemented, t.credits.paymentNotImplementedHint);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          useWideLayout && styles.scrollDesktop,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.container,
            { maxWidth: useWideLayout ? WEB_MAX_WIDTH.content : 560 },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={[styles.backRow, { flexDirection: dir }]}
          >
            <BackIcon size={18} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "700" }}>{t.credits.back}</Text>
          </Pressable>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.summaryHeader, { flexDirection: dir }]}>
              <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}14` }]}>
                <Coins size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryTitle, { color: colors.foreground, textAlign }]}>
                  {t.credits.checkoutTitle}
                </Text>
                <Text style={{ color: colors.mutedForeground, textAlign }}>
                  {t.credits.checkoutSubtitle}
                </Text>
              </View>
            </View>
            <View style={[styles.amountRow, { borderTopColor: colors.border }]}>
              <Text style={{ color: colors.mutedForeground, fontSize: 15 }}>
                {t.credits.checkoutAmount}
              </Text>
              <Text style={[styles.amountValue, { color: colors.primary }]}>
                {t.credits.egp(amount)}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}>
            {t.credits.paymentMethod}
          </Text>

          <View style={styles.methods}>
            {methods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                id={method.id}
                label={method.label}
                subtitle={method.subtitle}
                onPress={() => handlePayment(method.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  scroll: {
    padding: 20,
    alignItems: "center",
    flexGrow: 1,
  },
  scrollDesktop: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 48,
  },
  container: {
    width: "100%",
    gap: 20,
  },
  backRow: {
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
    gap: 16,
  },
  summaryHeader: {
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 14,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: "900",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  methods: {
    gap: 14,
  },
});
