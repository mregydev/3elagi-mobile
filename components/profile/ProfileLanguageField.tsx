import React, { useId, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  FLAG_RATIO,
  Flag,
  FlagFrame,
  LANGUAGE_OPTIONS,
} from "@/components/language/LanguageFlags";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  embedded?: boolean;
  inFooter?: boolean;
  /** Half-width flag cards — native profile only */
  wideCards?: boolean;
}

const OPTION_GAP = 10;
const OPTION_PADDING = 14;

export function ProfileLanguageField({
  embedded = false,
  inFooter = false,
  wideCards = false,
}: Props) {
  const colors = useColors();
  const { locale, setLocale, isRTL, t } = useI18n();
  const clipSuffix = useId().replace(/:/g, "");
  const dir = isRTL ? "row-reverse" : "row";
  const [rowWidth, setRowWidth] = useState(0);

  const compactFlagW = inFooter ? 24 : 34;
  const compactFlagH = Math.round(compactFlagW / FLAG_RATIO);

  const optionWidth =
    rowWidth > 0 ? (rowWidth - OPTION_GAP) / 2 - OPTION_PADDING * 2 : 0;
  const embeddedFlagW = Math.max(72, Math.floor(optionWidth));
  const embeddedFlagH = Math.round(embeddedFlagW / FLAG_RATIO);

  if (embedded && wideCards) {
    return (
      <View style={styles.embedded}>
        <Text
          style={[
            styles.embeddedLabel,
            { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t.settings.language}
        </Text>
        <View
          style={[styles.embeddedRow, { flexDirection: dir }]}
          onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const active = locale === option.locale;
            return (
              <Pressable
                key={option.locale}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: active }}
                onPress={() => setLocale(option.locale)}
                style={[
                  styles.langOption,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? `${colors.primary}10` : colors.background,
                  },
                ]}
              >
                {optionWidth > 0 ? (
                  <FlagFrame
                    w={embeddedFlagW}
                    h={embeddedFlagH}
                    selected={active}
                    colors={colors}
                  >
                    <Flag
                      locale={option.locale}
                      w={embeddedFlagW}
                      h={embeddedFlagH}
                      clipSuffix={`profile-${option.locale}-${clipSuffix}`}
                    />
                  </FlagFrame>
                ) : null}
                <Text
                  style={[
                    styles.langLabel,
                    { color: active ? colors.primary : colors.foreground, textAlign: "center" },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.langSublabel,
                    { color: colors.mutedForeground, textAlign: "center" },
                  ]}
                >
                  {option.sublabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (embedded) {
    const flagW = 34;
    const flagH = Math.round(flagW / FLAG_RATIO);

    return (
      <View style={styles.embedded}>
        <Text
          style={[
            styles.embeddedLabel,
            { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t.settings.language}
        </Text>
        <View style={[styles.flags, { flexDirection: dir, alignSelf: isRTL ? "flex-end" : "flex-start" }]}>
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
                    backgroundColor: active ? `${colors.primary}14` : colors.muted,
                  },
                ]}
              >
                <FlagFrame w={flagW} h={flagH} selected={active} colors={colors}>
                  <Flag
                    locale={option.locale}
                    w={flagW}
                    h={flagH}
                    clipSuffix={`profile-${option.locale}-${clipSuffix}`}
                  />
                </FlagFrame>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.row,
        { flexDirection: dir },
        inFooter && styles.footerRow,
      ]}
    >
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.settings.language}</Text>
      <View style={[styles.flags, { flexDirection: dir }]}>
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
              <FlagFrame w={compactFlagW} h={compactFlagH} selected={active} colors={colors}>
                <Flag
                  locale={option.locale}
                  w={compactFlagW}
                  h={compactFlagH}
                  clipSuffix={`profile-${option.locale}-${clipSuffix}`}
                />
              </FlagFrame>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 14,
    gap: 12,
  },
  footerRow: {
    marginTop: 0,
    marginBottom: 0,
  },
  embedded: {
    gap: 10,
  },
  embeddedLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  embeddedRow: {
    width: "100%",
    gap: OPTION_GAP,
  },
  langOption: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: OPTION_PADDING,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  langLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  langSublabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  flags: {
    alignItems: "center",
    gap: 8,
  },
  flagBtn: {
    borderRadius: 999,
    borderWidth: 1,
    padding: 2,
  },
});
