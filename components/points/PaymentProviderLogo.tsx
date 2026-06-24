import { Asset } from "expo-asset";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import type { PaymentMethodId } from "@/components/points/PaymentMethodCard";

const LOGO_HEIGHT = 48;

type LogoConfig = {
  source: number;
  aspect: number;
  backgroundColor: string;
  label: string;
};

const PAYMENT_LOGOS: Record<PaymentMethodId, LogoConfig> = {
  vodafone_cash: {
    source: require("../../assets/images/payments/vodafone-cash.png"),
    aspect: 600 / 330,
    backgroundColor: "#ffffff",
    label: "Vodafone Cash",
  },
  fawry: {
    source: require("../../assets/images/payments/fawry.png"),
    aspect: 800 / 449,
    backgroundColor: "#FFCB05",
    label: "Fawry",
  },
  credit_card: {
    source: require("../../assets/images/payments/credit-card.png"),
    aspect: 860 / 914,
    backgroundColor: "#ffffff",
    label: "Credit card",
  },
};

function VodafoneSvgFallback() {
  return (
    <Svg width={LOGO_HEIGHT} height={LOGO_HEIGHT} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="24" fill="#E60000" />
      <Circle cx="30" cy="20" r="10" fill="#FFFFFF" />
      <Circle cx="18" cy="28" r="8" fill="#FFFFFF" />
    </Svg>
  );
}

function FawrySvgFallback() {
  return (
    <View style={[styles.fallbackFrame, { backgroundColor: "#FFCB05" }]}>
      <Svg width={56} height={LOGO_HEIGHT} viewBox="0 0 56 48">
        <SvgText
          x="28"
          y="30"
          fill="#0066B3"
          fontSize="14"
          fontWeight="700"
          textAnchor="middle"
        >
          fawry
        </SvgText>
      </Svg>
    </View>
  );
}

function CreditCardSvgFallback() {
  return (
    <Svg width={44} height={LOGO_HEIGHT} viewBox="0 0 44 48">
      <Circle cx="16" cy="24" r="12" fill="#EB001B" opacity={0.9} />
      <Circle cx="28" cy="24" r="12" fill="#F79E1B" opacity={0.9} />
    </Svg>
  );
}

function SvgFallback({ id }: { id: PaymentMethodId }) {
  if (id === "vodafone_cash") return <VodafoneSvgFallback />;
  if (id === "fawry") return <FawrySvgFallback />;
  return <CreditCardSvgFallback />;
}

async function resolveBundledImageUri(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  if (!asset.downloaded) {
    await asset.downloadAsync();
  }
  const uri = asset.localUri ?? asset.uri;
  if (!uri) {
    throw new Error("Bundled payment logo URI missing");
  }
  return uri;
}

function PaymentLogoImage({ id }: { id: PaymentMethodId }) {
  const logo = PAYMENT_LOGOS[id];
  const [uri, setUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const height = LOGO_HEIGHT;
  const width = Math.max(40, Math.round(height * logo.aspect));

  useEffect(() => {
    let cancelled = false;
    void resolveBundledImageUri(logo.source)
      .then((resolvedUri) => {
        if (!cancelled) setUri(resolvedUri);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [logo.source]);

  if (failed) {
    return <SvgFallback id={id} />;
  }

  return (
    <View
      style={[
        styles.frame,
        {
          width,
          height,
          backgroundColor: logo.backgroundColor,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width, height }}
          contentFit="contain"
          accessibilityLabel={logo.label}
          onError={() => setFailed(true)}
        />
      ) : null}
    </View>
  );
}

export function PaymentProviderLogo({ id }: { id: PaymentMethodId }) {
  return (
    <View style={styles.slot}>
      <PaymentLogoImage id={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackFrame: {
    width: 56,
    height: LOGO_HEIGHT,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
