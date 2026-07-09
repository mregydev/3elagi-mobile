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
import {
  specialityGradient,
  specialityVisual,
} from "@/domains/home/specialityVisuals";
import { useColors } from "@/hooks/useColors";
import { useWebLayout } from "@/hooks/useWebLayout";

function SpecialityTile({
  item,
  isRTL,
  index,
  onPress,
  tileWidth,
}: {
  item: Speciality;
  isRTL: boolean;
  index: number;
  onPress: () => void;
  tileWidth: `${number}%`;
}) {
  const colors = useColors();
  const label = isRTL ? item.nameAr : item.nameEn;
  const { icon: Icon, color } = specialityVisual(item.nameEn);
  const scale = useSharedValue(1);
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 55).springify().damping(14)}
      style={[styles.tile, { width: tileWidth }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.86, { damping: 12 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 10 });
        }}
        onHoverIn={() => {
          scale.value = withSpring(1.1, { damping: 12 });
        }}
        onHoverOut={() => {
          scale.value = withSpring(1, { damping: 12 });
        }}
        style={styles.pressable}
      >
        <Animated.View style={[styles.orbShadow, { shadowColor: color }, orbStyle]}>
          <LinearGradient
            colors={specialityGradient(color)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orb}
          >
            <Icon size={26} color="#fff" />
          </LinearGradient>
        </Animated.View>
        <Text
          style={[styles.tileLabel, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </Pressable>
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
  const { gridColumns } = useWebLayout();
  const columns = Math.max(gridColumns, 4);
  const tileWidth = `${100 / columns}%` as `${number}%`;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.headingRow,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <Image
          source={require("@/assets/images/splash-mark.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.heading}>
          {isRTL ? "التخصصات الطبية" : "Medical Specialities"}
        </Text>
      </View>
      <View style={styles.grid}>
        {specialities.map((item, index) => (
          <SpecialityTile
            key={item.id}
            item={item}
            isRTL={isRTL}
            index={index}
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
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "#F4F7FF",
    borderRadius: 24,
  },
  headingRow: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 48,
  },
  logo: { width: 30, height: 30 },
  heading: {
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3,
    color: "#1D4ED8",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  tile: { paddingVertical: 12, paddingHorizontal: 4 },
  pressable: { alignItems: "center" },
  orbShadow: {
    borderRadius: 30,
    marginBottom: 9,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.4,
    shadowRadius: 9,
    elevation: 7,
  },
  orb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tileLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
});
