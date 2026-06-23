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

interface PointsCheckoutViewProps {
  amount: number;
}

export function PointsCheckoutView({ amount }: PointsCheckoutViewProps) {
  const colors = useColors();
  const { isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const dir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const methods: Array<{
    id: PaymentMethodId;
    label: string;
    subtitle: string;
  }> = [
    {
      id: "vodafone_cash",
      label: isRTL ? "فودافون كاش" : "Vodafone Cash",
      subtitle: isRTL ? "ادفع من محفظة فودافون" : "Pay from your Vodafone wallet",
    },
    {
      id: "fawry",
      label: isRTL ? "فوري" : "Fawry",
      subtitle: isRTL ? "ادفع عبر فوري" : "Pay through Fawry",
    },
    {
      id: "credit_card",
      label: isRTL ? "بطاقة ائتمان" : "Credit card",
      subtitle: isRTL ? "Visa / Mastercard" : "Visa / Mastercard",
    },
  ];

  const handlePayment = (_method: PaymentMethodId) => {
    showErrorToast(
      isRTL ? "غير متاح بعد" : "Not implemented yet",
      isRTL
        ? "طريقة الدفع هذه ستكون متاحة قريبًا."
        : "This payment method will be available soon.",
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.container, { maxWidth: isDesktop ? WEB_MAX_WIDTH.content : 560 }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backRow, { flexDirection: dir }]}
          >
            <BackIcon size={18} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {isRTL ? "رجوع" : "Back"}
            </Text>
          </Pressable>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.summaryHeader, { flexDirection: dir }]}>
              <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}14` }]}>
                <Coins size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryTitle, { color: colors.foreground, textAlign }]}>
                  {isRTL ? "إتمام شراء النقاط" : "Points checkout"}
                </Text>
                <Text style={{ color: colors.mutedForeground, textAlign }}>
                  {isRTL ? "راجع المبلغ واختر طريقة الدفع" : "Review your order and choose payment"}
                </Text>
              </View>
            </View>
            <View style={[styles.amountRow, { borderTopColor: colors.border }]}>
              <Text style={{ color: colors.mutedForeground, fontSize: 15 }}>
                {isRTL ? "عدد النقاط" : "Points"}
              </Text>
              <Text style={[styles.amountValue, { color: colors.primary }]}>{amount}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}>
            {isRTL ? "طريقة الدفع" : "Payment method"}
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
  root: { flex: 1 },
  scroll: {
    padding: 20,
    alignItems: "center",
  },
  container: {
    width: "100%",
    gap: 16,
  },
  backRow: {
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 14,
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
    gap: 12,
  },
});
