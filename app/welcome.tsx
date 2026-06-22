import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo3elagi } from "@/components/Logo3elagi";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

const WELCOME_HERO_MOBILE = require("@/assets/images/welcome-hero-mobile.jpg");

export default function WelcomeScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const logoHeight = Math.min(72, screenWidth * 0.2);

  return (
    <View style={styles.root}>
      <Image
        source={WELCOME_HERO_MOBILE}
        style={styles.background}
        contentFit="cover"
        contentPosition="center"
        accessibilityLabel=""
      />

      <LinearGradient
        colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.92)", "#ffffff"]}
        locations={[0, 0.55, 1]}
        style={styles.overlay}
        pointerEvents="none"
      />

      <View
        style={[
          styles.page,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={styles.logoHeader}>
          <Logo3elagi height={logoHeight} centered />
        </View>

        <View style={styles.spacer} />

        <View style={styles.actions}>
          <Text style={[styles.ctaTitle, { color: colors.foreground }]}>
            {t.auth.welcomeCtaTitle}
          </Text>
          <Text style={[styles.ctaSubtitle, { color: colors.mutedForeground }]}>
            {t.auth.welcomeCtaSubtitle}
          </Text>

          <Pressable
            onPress={() => router.push("/auth/login")}
            style={({ pressed }) => [
              styles.btnPrimary,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.92 : 1,
                shadowColor: colors.primary,
              },
            ]}
          >
            <Text style={styles.btnPrimaryText}>{t.auth.logIn}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/auth/signup")}
            style={({ pressed }) => [
              styles.btnGhost,
              {
                borderColor: colors.primary,
                backgroundColor: pressed ? colors.muted : colors.card,
              },
            ]}
          >
            <Text style={[styles.btnGhostText, { color: colors.primary }]}>
              {t.auth.register}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#eef4fc" },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  page: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoHeader: {
    alignItems: "center",
  },
  spacer: { flex: 1, minHeight: 24 },
  actions: {
    gap: 12,
    width: "100%",
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  ctaSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 4,
  },
  btnPrimary: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  btnGhost: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
  },
  btnGhostText: { fontWeight: "800", fontSize: 16 },
});
