import React, { useId, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  FLAG_RATIO,
  Flag,
  FlagFrame,
  LANGUAGE_OPTIONS,
} from "@/components/language/LanguageFlags";
import type { Locale } from "@/domains/i18n/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

type Props = {
  value?: Locale;
  onChange?: (locale: Locale) => void;
  /** Size flags to fill the row width (profile preferences). */
  fillWidth?: boolean;
};

const FLAG_GAP = 12;
const MIN_FLAG_W = 36;
const MAX_FLAG_W = 56;

export function LanguageFlagRow({ value, onChange, fillWidth = false }: Props) {
  const colors = useColors();
  const { locale: storeLocale, setLocale, isRTL } = useI18n();
  const locale = value ?? storeLocale;
  const applyLocale = onChange ?? setLocale;
  const clipSuffix = useId().replace(/:/g, "");
  const [rowWidth, setRowWidth] = useState(0);

  const flagW =
    fillWidth && rowWidth > 0
      ? Math.min(
          MAX_FLAG_W,
          Math.max(
            MIN_FLAG_W,
            Math.floor(
              (rowWidth - FLAG_GAP * (LANGUAGE_OPTIONS.length - 1)) /
                LANGUAGE_OPTIONS.length,
            ),
          ),
        )
      : 44;
  const flagH = Math.round(flagW / FLAG_RATIO);

  return (
    <View
      onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
      style={[
        styles.row,
        {
          flexDirection: isRTL ? "row-reverse" : "row",
          justifyContent: fillWidth ? "space-between" : "flex-start",
          gap: FLAG_GAP,
        },
      ]}
    >
      {LANGUAGE_OPTIONS.map((option) => {
        const active = locale === option.locale;
        return (
          <Pressable
            key={option.locale}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            onPress={() => applyLocale(option.locale)}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.flagBtn,
              (pressed || hovered) && { opacity: 0.85 },
            ]}
          >
            <FlagFrame w={flagW} h={flagH} selected={active} colors={colors}>
              <Flag
                locale={option.locale}
                w={flagW}
                h={flagH}
                clipSuffix={`row-${option.locale}-${clipSuffix}`}
              />
            </FlagFrame>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    alignItems: "center",
  },
  flagBtn: {
    cursor: "pointer" as "auto",
  },
});
