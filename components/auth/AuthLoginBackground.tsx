import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

const LOGIN_HERO = require("@/assets/images/auth-login-hero.png");

interface Props {
  children: React.ReactNode;
}

/** Full-bleed login hero background — shared by native and web auth shells. */
export function AuthLoginBackground({ children }: Props) {
  return (
    <View style={styles.page}>
      <Image
        source={LOGIN_HERO}
        style={styles.image}
        contentFit="cover"
        accessibilityLabel=""
      />
      <View style={styles.overlay} />
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
});
