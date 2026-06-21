import React, { useId } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  FLAG_RATIO,
  Flag,
  FlagFrame,
  LANGUAGE_OPTIONS,
} from "@/components/language/LanguageFlags";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

export function AuthLanguageField() {
  const colors = useColors();
  const { locale, setLocale, isRTL } = useI18n();
  const clipSuffix = useId().replace(/:/g, "");
  const flagW = 34;
  const flagH = Math.round(flagW / FLAG_RATIO);
  const dir = isRTL ? "row-reverse" : "row";

  return (
    <View style={[styles.row, { flexDirection: dir }]}>
      {LANGUAGE_OPTIONS.map((option) => {
        const active = locale === option.locale;
        return (
          <Pressable
            key={option.locale}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            onPress={() => setLocale(option.locale)}
            style={[
              styles.flagBtn,
              {
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? `${colors.primary}14` : colors.card,
              },
            ]}
          >
            <FlagFrame w={flagW} h={flagH} selected={active} colors={colors}>
              <Flag
                locale={option.locale}
                w={flagW}
                h={flagH}
                clipSuffix={`auth-${option.locale}-${clipSuffix}`}
              />
            </FlagFrame>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", gap: 8 },
  flagBtn: {
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
  },
});
