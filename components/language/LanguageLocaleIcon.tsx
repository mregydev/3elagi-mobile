import {
  BookOpen,
  Languages,
  MessageCircle,
  Type,
  type LucideIcon,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import type { Locale } from "@/domains/i18n/store";

const LOCALE_ICON: Record<
  Locale,
  { Icon: LucideIcon; color: string }
> = {
  ar: { Icon: Languages, color: "#0F766E" },
  en: { Icon: Type, color: "#1D4ED8" },
  de: { Icon: BookOpen, color: "#B45309" },
  es: { Icon: MessageCircle, color: "#C2410C" },
};

type Props = {
  locale: Locale;
  size: number;
  selected?: boolean;
};

/** Expressive per-locale icon badge (no national flags). */
export function LanguageLocaleIcon({ locale, size, selected }: Props) {
  const { Icon, color } = LOCALE_ICON[locale] ?? LOCALE_ICON.en;
  const iconSize = Math.round(size * 0.52);

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: selected ? `${color}22` : `${color}12`,
          borderColor: selected ? color : `${color}33`,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <Icon size={iconSize} color={color} strokeWidth={2.25} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
});
