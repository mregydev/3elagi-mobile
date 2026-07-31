import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { Locale } from "@/domains/i18n/store";

/**
 * Distinctive script glyphs — instantly readable as each language,
 * without national flags or generic “settings” icons.
 */
const LOCALE_GLYPH: Record<
  Locale,
  { glyph: string; color: string; fontScale: number; tracking?: number }
> = {
  // ع — Arabic letter ʿayn
  ar: { glyph: "ع", color: "#0F766E", fontScale: 0.72 },
  // Aa — Latin pair signals English orthography
  en: { glyph: "Aa", color: "#1D4ED8", fontScale: 0.48, tracking: -0.5 },
  // Ä — umlaut is the German giveaway
  de: { glyph: "Ä", color: "#B45309", fontScale: 0.62 },
  // Ñ — uniquely Spanish
  es: { glyph: "Ñ", color: "#C2410C", fontScale: 0.62 },
};

type Props = {
  locale: Locale;
  size: number;
  selected?: boolean;
};

/** Expressive per-locale script badge (no national flags). */
export function LanguageLocaleIcon({ locale, size, selected }: Props) {
  const meta = LOCALE_GLYPH[locale] ?? LOCALE_GLYPH.en;
  const fontSize = Math.round(size * meta.fontScale);

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: selected ? `${meta.color}24` : `${meta.color}12`,
          borderColor: selected ? meta.color : `${meta.color}40`,
          borderWidth: selected ? 2 : 1.5,
        },
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.glyph,
          {
            color: meta.color,
            fontSize,
            lineHeight: fontSize * 1.15,
            letterSpacing: meta.tracking ?? 0,
            fontFamily: Platform.select({
              ios: locale === "ar" ? "Geeza Pro" : "AvenirNext-DemiBold",
              android: locale === "ar" ? "serif" : "sans-serif-medium",
              web: locale === "ar"
                ? '"Segoe UI", "Noto Naskh Arabic", "Arabic Typesetting", serif'
                : '"Avenir Next", "Segoe UI", system-ui, sans-serif',
              default: undefined,
            }),
            fontWeight: locale === "ar" ? "700" : "800",
          },
        ]}
      >
        {meta.glyph}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glyph: {
    textAlign: "center",
    includeFontPadding: false,
  },
});
