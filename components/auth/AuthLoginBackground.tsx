import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { Logo3elagi } from "@/components/Logo3elagi";

const AUTH_HERO = require("@/assets/images/auth-hero.png");

const CARD_WIDTH_RATIO = 0.9;
/** Breathing room between the brand mark and the card. */
const LOGO_GAP = 18;

interface Props {
  children: React.ReactNode;
}

/**
 * Native auth shell — hero photo, brand mark, and a frosted card docked to the
 * bottom, shared by login, signup and the password/verification screens.
 *
 * Scrolling lives here rather than in each screen (see AuthFormBody): that lets
 * the card size itself to the form instead of carrying a fixed height, which is
 * what left dead space under short forms. A tall form grows until it fills the
 * space and then scrolls.
 * (Web keeps its own hero — see AuthLoginBackground.web.tsx.)
 */
export function AuthLoginBackground({ children }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const logoHeight = Math.min(56, width * 0.16);

  return (
    <View style={styles.page}>
      <Image
        source={AUTH_HERO}
        style={styles.image}
        contentFit="cover"
        contentPosition="center"
        accessibilityLabel=""
      />

      <LinearGradient
        colors={[
          "rgba(255,255,255,0.05)",
          "rgba(255,255,255,0.22)",
          "rgba(238,244,252,0.45)",
        ]}
        locations={[0, 0.45, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      <View style={[styles.brand, { paddingTop: insets.top + 10 }]}>
        <Logo3elagi height={logoHeight} centered />
      </View>

      <KeyboardSafeScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 12 },
        ]}
        bottomOffset={32}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { width: width * CARD_WIDTH_RATIO }]}>
          {/* Frosted white, not solid: the hero stays visible behind the form. */}
          <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.tint} pointerEvents="none" />
          {children}
        </View>
      </KeyboardSafeScrollView>
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
  brand: {
    alignItems: "center",
    paddingBottom: 8,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "transparent",
  },
  scrollContent: {
    flexGrow: 1,
    // Docked to the bottom; a form taller than the screen pushes up and scrolls.
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: LOGO_GAP,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    overflow: "hidden",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
});
