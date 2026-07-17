import React from "react";
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { countryFlagEmoji } from "@/constants/patientCountries";

type Props = {
  name: string;
  country?: string | null;
  nameStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  numberOfLines?: number;
  /** LTR: flag then name. RTL: name then flag (still reads naturally). */
  isRTL?: boolean;
};

/** Peer/doctor name with optional residence country flag. */
export function NameWithCountryFlag({
  name,
  country,
  nameStyle,
  style,
  numberOfLines = 1,
  isRTL = false,
}: Props) {
  const flag = countryFlagEmoji(country);
  if (!flag) {
    return (
      <Text style={nameStyle} numberOfLines={numberOfLines}>
        {name}
      </Text>
    );
  }

  return (
    <View
      style={[
        styles.row,
        { flexDirection: isRTL ? "row-reverse" : "row" },
        style,
      ]}
    >
      <Text style={styles.flag} accessibilityLabel={country?.toUpperCase()}>
        {flag}
      </Text>
      <Text style={[styles.name, nameStyle]} numberOfLines={numberOfLines}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  flag: {
    fontSize: 16,
    lineHeight: 20,
  },
  name: {
    flexShrink: 1,
    minWidth: 0,
  },
});
