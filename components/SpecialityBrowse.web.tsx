import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { surfaceCard, UI } from "@/constants/uiTokens";
import type { Speciality } from "@/domains/home/api";
import { specialityLabel } from "@/domains/home/specialityLabel";
import {
  specialityGradient,
  specialityVisual,
} from "@/domains/home/specialityVisuals";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";

const CIRCLE = 88;

function SpecialityTile({
  item,
  onPress,
  tileWidth,
}: {
  item: Speciality;
  onPress: () => void;
  tileWidth: `${number}%`;
}) {
  const colors = useColors();
  const { locale, isRTL } = useI18n();
  const label = specialityLabel(item, locale);
  const { icon: Icon, color, image } = specialityVisual(item.nameEn);
  const illustration = image ?? (item.imageUrl ? { uri: item.imageUrl } : null);
  const isArabic = locale === "ar";
  const [hovered, setHovered] = useState(false);

  return (
    <View style={[styles.tile, { width: tileWidth }]}>
      <Pressable
        onPress={onPress}
        // @ts-expect-error RN Web hover
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={({ pressed }) => [
          styles.pressable,
          { opacity: pressed ? 0.88 : hovered ? 0.96 : 1 },
        ]}
      >
        {illustration ? (
          <View
            style={[
              styles.circle,
              surfaceCard(colors.card, `${color}55`),
              { borderColor: `${color}66` },
            ]}
          >
            <Image
              source={illustration}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
        ) : (
          <LinearGradient
            colors={specialityGradient(color)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.circle, styles.orbFallback, { borderColor: `${color}55` }]}
          >
            <Icon size={32} color="#fff" />
          </LinearGradient>
        )}
        <Text
          style={[
            styles.primaryLabel,
            {
              color: colors.foreground,
              fontSize: isArabic ? 17 : 14,
              lineHeight: isArabic ? 24 : 20,
              writingDirection: isRTL ? "rtl" : "ltr",
            },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

interface SpecialityGridProps {
  specialities: Speciality[];
  isRTL: boolean;
  onSelect: (speciality: Speciality) => void;
}

export function SpecialityGrid({
  specialities,
  isRTL,
  onSelect,
}: SpecialityGridProps) {
  const colors = useColors();
  const { locale } = useI18n();
  const { gridColumns } = useWebLayout();
  const columns = Math.max(gridColumns, 3);
  const tileWidth = `${100 / columns}%` as `${number}%`;
  const heading =
    locale === "ar"
      ? "التخصصات الطبية"
      : locale === "de"
        ? "Medizinische Fachgebiete"
        : locale === "es"
          ? "Especialidades médicas"
          : "Medical Specialities";

  const isArabic = locale === "ar";

  return (
    <View
      style={[
        styles.wrap,
        surfaceCard(colors.card, colors.border),
        { direction: isRTL ? "rtl" : "ltr" } as object,
      ]}
      // @ts-expect-error web writing direction
      dir={isRTL ? "rtl" : "ltr"}
    >
      <View style={styles.headingRow}>
        <Image
          source={require("@/assets/images/splash-mark.png")}
          style={[styles.logo, { tintColor: colors.primary }]}
          resizeMode="contain"
        />
        <Text
          style={[
            styles.heading,
            {
              color: colors.foreground,
              fontSize: isArabic ? 24 : 20,
              writingDirection: isRTL ? "rtl" : "ltr",
            },
          ]}
        >
          {heading}
        </Text>
      </View>
      <View style={styles.grid}>
        {specialities.map((item) => (
          <SpecialityTile
            key={item.id}
            item={item}
            tileWidth={tileWidth}
            onPress={() => onSelect(item)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 18,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "nowrap",
    gap: 10,
    marginBottom: 22,
  },
  logo: { width: 26, height: 26, flexShrink: 0, opacity: 0.9 },
  heading: {
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  tile: { paddingVertical: 10, paddingHorizontal: 8 },
  pressable: {
    alignItems: "center",
    cursor: "pointer" as "auto",
    ...UI.pressable,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 10,
  },
  illustration: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  orbFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: {
    fontWeight: "600",
    textAlign: "center",
  },
});
