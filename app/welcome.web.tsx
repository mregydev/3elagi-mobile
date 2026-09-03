import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AuthLanguageField } from "@/components/auth/AuthLanguageField";
import { Logo3elagi } from "@/components/Logo3elagi";
import { LOGO_HEIGHT } from "@/constants/brand";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { alignText, flexRow } from "@/utils/rtl";

const WELCOME_HERO_LEFT = require("@/assets/images/welcome-hero-left.jpg");

export default function WelcomeScreenWeb() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop, isMobile, isTablet } = useWebLayout();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const stackVertical = !isTablet;

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
        <View style={[styles.actionTopBar, { flexDirection: dir, paddingHorizontal: isMobile ? 16 : 20 }]}>
          <View style={styles.actionTopSpacer} />
          <AuthLanguageField />
        </View>

        <View style={[styles.actionBody, { paddingHorizontal: isMobile ? 16 : 24 }]}>
          <View style={styles.actionContent}>
            <Logo3elagi
              height={isDesktop ? LOGO_HEIGHT.welcomeDesktop : LOGO_HEIGHT.welcomeHero}
              centered
            />

            <Text
              style={[
                styles.ctaTitle,
                { color: colors.foreground, textAlign },
                isMobile && styles.ctaTitleMobile,
              ]}
            >
              {t.auth.comingSoonTitle}
            </Text>
            <Text style={[styles.ctaSubtitle, { color: colors.mutedForeground, textAlign }]}>
              {t.auth.comingSoonSubtitle}
            </Text>
          </View>
        </View>
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
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
    gap: 8,
  },
  actionTopSpacer: { flex: 1 },
  actionBody: {
    flex: 1,
    minHeight: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 32,
  },
  actionContent: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: 18,
    alignSelf: "center",
  },
  ctaTitle: {
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 48,
    letterSpacing: -0.6,
    marginTop: 8,
  },
  ctaTitleMobile: {
    fontSize: 34,
    lineHeight: 40,
  },
  ctaSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
});
