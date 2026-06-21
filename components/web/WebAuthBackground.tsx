import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export const WEB_AUTH_GRADIENT = {
  colors: ["#e8efff", "#f8fafc", "#ecfdf5"] as const,
  locations: [0, 0.5, 1] as const,
};

interface Props {
  children: React.ReactNode;
}

/** Shared welcome / auth gradient shell for web marketing pages. */
export function WebAuthBackground({ children }: Props) {
  const colors = useColors();

  return (
    <View style={styles.page}>
      <LinearGradient
        colors={[...WEB_AUTH_GRADIENT.colors]}
        locations={[...WEB_AUTH_GRADIENT.locations]}
        style={styles.gradient}
      >
        <View style={[styles.blob, styles.blobTop, { backgroundColor: colors.primary }]} />
        <View style={[styles.blob, styles.blobBottom, { backgroundColor: colors.success }]} />
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  gradient: {
    flex: 1,
    minHeight: "100%",
    width: "100%",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.07,
  },
  blobTop: {
    width: 360,
    height: 360,
    top: -120,
    alignSelf: "center",
  },
  blobBottom: {
    width: 280,
    height: 280,
    bottom: 40,
    left: -100,
  },
});
