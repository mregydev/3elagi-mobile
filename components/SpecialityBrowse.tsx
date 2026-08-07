import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { Speciality } from "@/domains/home/api";
import { specialityLabel } from "@/domains/home/specialityLabel";
import {
  specialityGradient,
  specialityVisual,
} from "@/domains/home/specialityVisuals";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

/** Sized for ≥3 tiles per row on narrow native phones. */
const CIRCLE = 72;
const COLUMNS = 3;

function SpecialityTile({
  item,
  index,
  onPress,
}: {
  item: Speciality;
  index: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const { locale, isRTL } = useI18n();
  const label = specialityLabel(item, locale);
  const { icon: Icon, color, image } = specialityVisual(item.nameEn);
  const illustration = image ?? (item.imageUrl ? { uri: item.imageUrl } : null);
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const isArabic = locale === "ar";

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 45).springify().damping(14)}
      style={styles.tile}
    >
      <Animated.View style={cardStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={() => {
            scale.value = withSpring(0.96, { damping: 14 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 12 });
          }}
          style={styles.pressable}
        >
          {illustration ? (
            <View
              style={[
                styles.circle,
                {
                  borderColor: color,
                  shadowColor: color,
                },
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
              style={[styles.circle, styles.orbFallback, { borderColor: color }]}
            >
              <Icon size={28} color="#fff" />
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
      </Animated.View>
    </Animated.View>
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
  const { locale } = useI18n();
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
      style={[styles.wrap, { direction: isRTL ? "rtl" : "ltr" } as object]}
      // @ts-expect-error web writing direction
      dir={isRTL ? "rtl" : "ltr"}
    >
      <View style={styles.headingRow}>
        <Image
          source={require("@/assets/images/splash-mark.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text
          style={[
            styles.heading,
            {
              fontSize: isArabic ? 24 : 20,
              writingDirection: isRTL ? "rtl" : "ltr",
            },
          ]}
        >
          {heading}
        </Text>
      </View>
      {/*
        Use direction/dir for RTL — do NOT also use row-reverse
        (that double-flips and leaves the empty gap on the right).
      */}
      <View style={styles.grid}>
        {specialities.map((item, index) => (
          <SpecialityTile
            key={item.id}
            item={item}
            index={index}
            onPress={() => onSelect(item)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 6,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: "#EEF3F8",
    borderRadius: 24,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "nowrap",
    gap: 10,
    marginBottom: 18,
  },
  logo: { width: 28, height: 28, flexShrink: 0 },
  heading: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.2,
    color: "#1D4ED8",
    flexShrink: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  tile: {
    width: `${100 / COLUMNS}%`,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  pressable: { alignItems: "center" },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    overflow: "hidden",
    borderWidth: 2,
    marginBottom: 8,
    backgroundColor: "transparent",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 20,
  },
});
