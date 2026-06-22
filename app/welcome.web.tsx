import { Image } from "expo-image";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AuthLanguageField } from "@/components/auth/AuthLanguageField";
import { WelcomeLoginForm } from "@/components/auth/WelcomeLoginForm.web";
import { WelcomeSignupForm } from "@/components/auth/WelcomeSignupForm.web";
import { Logo3elagi } from "@/components/Logo3elagi";
import { LOGO_HEIGHT } from "@/constants/brand";
import { WEB_BREAKPOINTS } from "@/constants/webLayout";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { alignText, flexRow } from "@/utils/rtl";

const WELCOME_HERO_LEFT = require("@/assets/images/welcome-hero-left.jpg");

type WelcomePanel = "home" | "login" | "signup";

export default function WelcomeScreenWeb() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { width, isDesktop } = useWebLayout();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const stackVertical = width < WEB_BREAKPOINTS.tablet;
  const [panel, setPanel] = useState<WelcomePanel>("home");
  const showForm = panel !== "home";

  const formTitle =
    panel === "login" ? t.auth.logIn : panel === "signup" ? t.auth.register : "";

  return (
    <View
      style={[
        styles.shell,
        stackVertical
          ? styles.shellStacked
          : { flexDirection: isRTL ? "row-reverse" : "row" },
      ]}
    >
      {!stackVertical ? (
        <View style={styles.heroPane}>
          <Image
            source={WELCOME_HERO_LEFT}
            style={styles.heroImage}
            contentFit="cover"
            contentPosition="left center"
            accessibilityLabel=""
          />
        </View>
      ) : null}

      <View
        style={[
          styles.actionPane,
          { backgroundColor: colors.background },
          stackVertical && styles.actionPaneFull,
        ]}
      >
        <View style={[styles.actionTopBar, { flexDirection: dir }]}>
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
          <View style={styles.actionTopSpacer} />
          <AuthLanguageField />
        </View>

        <ScrollView
          style={styles.actionScroll}
          contentContainerStyle={[
            styles.actionScrollContent,
            !showForm && styles.actionScrollContentCentered,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {panel === "home" ? (
            <View style={styles.actionContent}>
              <Logo3elagi
                height={isDesktop ? LOGO_HEIGHT.welcomeDesktop : LOGO_HEIGHT.welcomeHero}
                centered
              />

              <Text style={[styles.ctaTitle, { color: colors.foreground, textAlign }]}>
                {t.auth.welcomeCtaTitle}
              </Text>
              <Text style={[styles.ctaSubtitle, { color: colors.mutedForeground, textAlign }]}>
                {t.auth.welcomeCtaSubtitle}
              </Text>

              <View style={styles.btnColumn}>
                <Pressable
                  onPress={() => setPanel("login")}
                  style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                    styles.btn,
                    styles.btnLogin,
                    { backgroundColor: colors.primary },
                    pressed && styles.btnPressed,
                    hovered && styles.btnLoginHovered,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnLoginText}>{t.auth.logIn}</Text>
                </Pressable>

                <Pressable
                  onPress={() => setPanel("signup")}
                  style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                    styles.btn,
                    styles.btnSignup,
                    {
                      borderColor: colors.primary,
                      backgroundColor: hovered ? `${colors.primary}08` : colors.card,
                    },
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.btnSignupText, { color: colors.primary }]}>
                    {t.auth.register}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.formSection}>
              <Text style={[styles.formTitle, { color: colors.foreground, textAlign }]}>
                {formTitle}
              </Text>
              {panel === "login" ? (
                <WelcomeLoginForm onSwitchToSignup={() => setPanel("signup")} />
              ) : (
                <WelcomeSignupForm onSwitchToLogin={() => setPanel("login")} />
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: "100vh" as unknown as number,
    width: "100%",
  },
  shellStacked: {
    flexDirection: "column",
  },
  heroPane: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: "#eef4fc",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  actionPane: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  actionPaneFull: {
    width: "100%",
    flex: 1,
  },
  actionTopBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    padding: 6,
    cursor: "pointer" as "auto",
  },
  backBtnPlaceholder: {
    width: 34,
    height: 34,
  },
  actionTopSpacer: { flex: 1 },
  actionScroll: {
    flex: 1,
    minHeight: 0,
  },
  actionScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  actionScrollContentCentered: {
    justifyContent: "center",
    alignItems: "center",
  },
  actionContent: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: 16,
    alignSelf: "center",
  },
  formSection: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    gap: 20,
    paddingTop: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    letterSpacing: -0.4,
    marginTop: 8,
  },
  ctaSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  btnColumn: {
    width: "100%",
    gap: 12,
    marginTop: 4,
  },
  btn: {
    width: "100%",
    minHeight: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 15,
    cursor: "pointer" as "auto",
  },
  btnLogin: {
    shadowColor: "#3057F2",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  btnLoginHovered: {
    opacity: 0.95,
    transform: [{ translateY: -1 }],
  },
  btnLoginText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  btnSignup: {
    borderWidth: 2.5,
  },
  btnSignupText: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
