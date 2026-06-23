import { Image } from "expo-image";
import React from "react";
import { View, StyleSheet } from "react-native";
import type { PaymentMethodId } from "@/components/points/PaymentMethodCard";

const LOGO_SIZE = 48;
const VODAFONE_CASH_LOGO = require("@/assets/images/payments/vodafone-cash.png");
const FAWRY_LOGO = require("@/assets/images/payments/fawry.png");
const CREDIT_CARD_LOGO = require("@/assets/images/payments/credit-card.png");

const VODAFONE_CASH_ASPECT = 600 / 330;
const FAWRY_ASPECT = 800 / 449;
const CREDIT_CARD_ASPECT = 860 / 914;

function PaymentLogoImage({
  source,
  aspect,
  label,
  backgroundColor = "#fff",
}: {
  source: number;
  aspect: number;
  label: string;
  backgroundColor?: string;
}) {
  const height = LOGO_SIZE;
  const width = Math.round(height * aspect);

  return (
    <View style={[styles.frame, { width, height, backgroundColor }]}>
      <Image
        source={source}
        style={{ width, height }}
        contentFit="contain"
        accessibilityLabel={label}
      />
    </View>
  );
}

function VodafoneCashLogo() {
  return (
    <PaymentLogoImage
      source={VODAFONE_CASH_LOGO}
      aspect={VODAFONE_CASH_ASPECT}
      label="Vodafone Cash"
    />
  );
}

function FawryLogo() {
  return (
    <PaymentLogoImage
      source={FAWRY_LOGO}
      aspect={FAWRY_ASPECT}
      label="Fawry"
      backgroundColor="#FFCB05"
    />
  );
}

function CreditCardsLogo() {
  return (
    <PaymentLogoImage
      source={CREDIT_CARD_LOGO}
      aspect={CREDIT_CARD_ASPECT}
      label="Credit card"
      backgroundColor="transparent"
    />
  );
}

export function PaymentProviderLogo({ id }: { id: PaymentMethodId }) {
  if (id === "vodafone_cash") return <VodafoneCashLogo />;
  if (id === "fawry") return <FawryLogo />;
  return <CreditCardsLogo />;
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
