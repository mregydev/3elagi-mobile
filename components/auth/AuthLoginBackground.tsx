import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

const AUTH_HERO = require("@/assets/images/welcome-hero-mobile.jpg");

interface Props {
  children: React.ReactNode;
}

/**
 * Native auth shell: the same hero + soft white wash the welcome screen uses,
 * so login/signup read as one flow with it. Forms sit on their own cards, and
 * the gradient keeps the lower half light enough for them.
 * (The web shell keeps its own hero — see AuthLoginBackground.web.tsx.)
 */
export function AuthLoginBackground({ children }: Props) {
  return (
    <View style={styles.page}>
      <Image
        source={AUTH_HERO}
        style={styles.image}
        contentFit="cover"
        contentPosition="top center"
        accessibilityLabel=""
      />

      <LinearGradient
        colors={[
          "rgba(255,255,255,0.10)",
          "rgba(255,255,255,0.35)",
          "rgba(238,244,252,0.80)",
          "rgba(255,255,255,0.94)",
        ]}
        locations={[0, 0.32, 0.6, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
});
