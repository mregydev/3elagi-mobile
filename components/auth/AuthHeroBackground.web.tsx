import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

const AUTH_HERO_WEB = require("@/assets/images/auth-login-hero-web.jpg");

interface Props {
  children: React.ReactNode;
  /** 0–1 white wash over the image for foreground readability. */
  overlayOpacity?: number;
}

/** Full-viewport auth hero image — web only, image scaled to fit. */
export function AuthHeroBackground({ children, overlayOpacity = 0.38 }: Props) {
  return (
    <View style={styles.page}>
      <Image
        source={AUTH_HERO_WEB}
        style={styles.image}
        contentFit="contain"
        contentPosition="center"
        accessibilityLabel=""
      />
      {overlayOpacity > 0 ? (
        <View
          style={[styles.overlay, { backgroundColor: `rgba(255, 255, 255, ${overlayOpacity})` }]}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: "100vh" as unknown as number,
    width: "100%",
    backgroundColor: "#eef4fc",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
