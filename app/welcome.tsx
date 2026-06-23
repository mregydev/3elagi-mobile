import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { AuthLanguageField } from "@/components/auth/AuthLanguageField";
import { WelcomeLoginForm } from "@/components/auth/WelcomeLoginForm";
import { WelcomeSignupForm } from "@/components/auth/WelcomeSignupForm";
import { Logo3elagi } from "@/components/Logo3elagi";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { flexRow } from "@/utils/rtl";

const WELCOME_HERO_MOBILE = require("@/assets/images/welcome-hero-mobile.jpg");

type WelcomePanel = "home" | "login" | "signup";

export default function WelcomeScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const logoHeight = Math.min(64, screenWidth * 0.18);
  const [panel, setPanel] = useState<WelcomePanel>("home");
  const showForm = panel !== "home";

  const formTitle =
    panel === "login" ? t.auth.logIn : panel === "signup" ? t.auth.register : "";

  return (
    <View style={styles.root}>
      <Image
        source={WELCOME_HERO_MOBILE}
        style={styles.background}
        contentFit="cover"
        contentPosition="top center"
        accessibilityLabel=""
      />

      <LinearGradient
        colors={[
          "rgba(255,255,255,0)",
          "rgba(255,255,255,0)",
          "rgba(238,244,252,0.2)",
          "rgba(255,255,255,0.5)",
        ]}
        locations={[0, 0.45, 0.72, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      <View
        style={[
          styles.page,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <View style={[styles.topBar, { flexDirection: dir }]}>
          {showForm ? (
            <Pressable
              onPress={() => setPanel("home")}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel={t.auth.goBack}
            >
              <ArrowLeft
                size={22}
                color={colors.foreground}
                style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined}
              />
            </Pressable>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}
          <View style={styles.topBarSpacer} />
          <AuthLanguageField />
        </View>

        {!showForm ? (
          <>
            <View style={styles.logoHeader}>
              <Logo3elagi height={logoHeight} centered />
            </View>
            <View style={styles.spacer} />
          </>
        ) : null}

        <View style={[styles.footerOuter, showForm && styles.footerOuterExpanded]}>
          <View
            style={[
              styles.footer,
              showForm && styles.footerExpanded,
              showForm && { borderColor: colors.border },
            ]}
          >
            {showForm ? (
              <View
                style={[styles.footerSolid, { backgroundColor: colors.background }]}
              />
            ) : (
              <>
                <BlurView intensity={85} tint="light" style={styles.footerBlur} />
                <View style={styles.footerTint} />
              </>
            )}

            {showForm ? (
              <KeyboardSafeScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.footerContent}
                bottomOffset={32}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.formTitle, { color: colors.foreground }]}>
                  {formTitle}
                </Text>

                {panel === "login" ? (
                  <WelcomeLoginForm onSwitchToSignup={() => setPanel("signup")} />
                ) : (
                  <WelcomeSignupForm onSwitchToLogin={() => setPanel("login")} />
                )}
              </KeyboardSafeScrollView>
            ) : (
              <View style={styles.footerContent}>
                <Text style={[styles.ctaTitle, { color: colors.foreground }]}>
                  {t.auth.welcomeCtaTitle}
                </Text>
                <Text style={[styles.ctaSubtitle, { color: colors.mutedForeground }]}>
                  {t.auth.welcomeCtaSubtitle}
                </Text>

                <Pressable
                  onPress={() => setPanel("login")}
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
                  onPress={() => setPanel("signup")}
                  style={({ pressed }) => [
                    styles.btnGhost,
                    {
                      borderColor: colors.primary,
                      backgroundColor: pressed
                        ? "rgba(255,255,255,0.45)"
                        : "rgba(255,255,255,0.55)",
                    },
                  ]}
                >
                  <Text style={[styles.btnGhostText, { color: colors.primary }]}>
                    {t.auth.register}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#eef4fc",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  page: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    alignItems: "center",
    gap: 8,
  },
  topBarSpacer: { flex: 1 },
  backBtn: {
    padding: 6,
  },
  backBtnPlaceholder: {
    width: 34,
    height: 34,
  },
  logoHeader: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: {
    flex: 1,
    minHeight: 48,
  },
  footerOuter: {
    marginHorizontal: 16,
    borderRadius: 28,
    shadowColor: "#0f2744",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 14,
  },
  footerOuterExpanded: {
    flex: 1,
    marginTop: 8,
    minHeight: 0,
  },
  footer: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  footerSolid: {
    ...StyleSheet.absoluteFillObject,
  },
  footerExpanded: {
    flex: 1,
    minHeight: 0,
  },
  footerBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  footerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  formScroll: {
    flex: 1,
    minHeight: 0,
  },
  footerContent: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  ctaSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 4,
  },
  btnPrimary: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
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
  btnGhostText: {
    fontWeight: "800",
    fontSize: 16,
  },
});
