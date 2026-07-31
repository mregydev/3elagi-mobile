import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LANGUAGE_OPTIONS } from "@/components/language/LanguageFlags";
import { LanguageLocaleIcon } from "@/components/language/LanguageLocaleIcon";
import type { Locale } from "@/domains/i18n/store";
import { useI18n } from "@/hooks/useI18n";

type Props = {
  value?: Locale;
  onChange?: (locale: Locale) => void;
  /** Size icons to fill the row width (profile preferences). */
  fillWidth?: boolean;
};

const ICON_GAP = 12;
const MIN_ICON = 40;
const MAX_ICON = 56;

export function LanguageFlagRow({ value, onChange, fillWidth = false }: Props) {
  const { locale: storeLocale, setLocale, isRTL } = useI18n();
  const locale = value ?? storeLocale;
  const applyLocale = onChange ?? setLocale;
  const [rowWidth, setRowWidth] = useState(0);

  const iconSize =
    fillWidth && rowWidth > 0
      ? Math.min(
          MAX_ICON,
          Math.max(
            MIN_ICON,
            Math.floor(
              (rowWidth - ICON_GAP * (LANGUAGE_OPTIONS.length - 1)) /
                LANGUAGE_OPTIONS.length,
            ),
          ),
        )
      : 44;

  return (
    <View
      onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
      style={[
        styles.row,
        {
          flexDirection: isRTL ? "row-reverse" : "row",
          justifyContent: fillWidth ? "space-between" : "flex-start",
          gap: ICON_GAP,
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
              styles.iconBtn,
              (pressed || hovered) && { opacity: 0.85 },
            ]}
          >
            <LanguageLocaleIcon
              locale={option.locale}
              size={iconSize}
              selected={active}
            />
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
  iconBtn: {
    cursor: "pointer" as "auto",
  },
});
