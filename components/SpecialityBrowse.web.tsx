import { Stethoscope } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Speciality } from "@/domains/home/api";
import { resolveSpecialityImageSource } from "@/domains/home/specialityImages";
import { useColors } from "@/hooks/useColors";
import { useWebLayout } from "@/hooks/useWebLayout";

const SPECIALITY_COLORS: Record<string, string> = {
  "General Medicine": "#3057F2",
  Cardiology: "#dc2626",
  Dermatology: "#0284c7",
  Pediatrics: "#f59e0b",
  Orthopedics: "#4f46e5",
  Neurology: "#7c3aed",
  Ophthalmology: "#0891b2",
  Dentistry: "#0d9488",
  Surgery: "#be123c",
};

function SpecialityTile({
  item,
  isRTL,
  onPress,
  tileWidth,
}: {
  item: Speciality;
  isRTL: boolean;
  onPress: () => void;
  tileWidth: `${number}%`;
}) {
  const colors = useColors();
  const label = isRTL ? item.nameAr : item.nameEn;
  const tint = SPECIALITY_COLORS[item.nameEn] ?? colors.primary;
  const localSource = resolveSpecialityImageSource(item.nameEn);
  const [remoteFailed, setRemoteFailed] = useState(false);
  const useRemote = !localSource && item.imageUrl && !remoteFailed;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.tile,
        {
          width: tileWidth,
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : hovered ? 0.95 : 1,
        },
      ]}
    >
      {localSource ? (
        <Image source={localSource} style={styles.tileImage} resizeMode="cover" />
      ) : useRemote ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.tileImage}
          resizeMode="cover"
          onError={() => setRemoteFailed(true)}
        />
      ) : (
        <View style={[styles.tileImage, styles.tileFallback, { backgroundColor: tint }]}>
          <Stethoscope size={32} color="#fff" />
        </View>
      )}
      <Text
        style={[styles.tileLabel, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
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
  const { gridColumns } = useWebLayout();
  const textAlign = isRTL ? "right" : "left";
  const gap = 12;
  const tileWidth =
    gridColumns === 4
      ? "23.5%"
      : gridColumns === 3
        ? "31.5%"
        : "47%";

  return (
    <View style={styles.wrap}>
      <Text
        style={[
          styles.heading,
          { color: colors.foreground, textAlign },
        ]}
      >
        {isRTL ? "التخصصات الطبية" : "Medical Specialities"}
      </Text>
      <View style={[styles.grid, { gap }]}>
        {specialities.map((item) => (
          <SpecialityTile
            key={item.id}
            item={item}
            isRTL={isRTL}
            tileWidth={tileWidth}
            onPress={() => onSelect(item)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  heading: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  tile: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 10,
  },
  tileImage: { width: "100%", height: 112 },
  tileFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 8,
    marginTop: 8,
  },
});
