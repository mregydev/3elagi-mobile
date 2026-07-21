import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CountryFlagToggle } from "@/components/country/CountryFlagToggle";
import type { MarketCountryCode } from "@/constants/patientCountries";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

type Props = {
  value: MarketCountryCode;
  onChange: (code: MarketCountryCode) => void;
  disabled?: boolean;
};

/** Egypt / Jordan flags for the mobile profile Preferences section. */
export function ProfileCountryField({ value, onChange, disabled }: Props) {
  const colors = useColors();
  const { isRTL, t } = useI18n();

  return (
    <View style={styles.wrap}>
      <Text
        style={[
          styles.label,
          { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
        ]}
      >
        {t.tabs.country}
      </Text>
      <CountryFlagToggle
        value={value}
        onChange={onChange}
        persist={false}
        disabled={disabled}
        showNames
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
});
