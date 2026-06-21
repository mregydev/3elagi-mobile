import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthLanguageField } from "@/components/auth/AuthLanguageField";
import { Logo3elagi } from "@/components/Logo3elagi";
import { WebAuthBackground } from "@/components/web/WebAuthBackground";
import { WelcomeDoctorIllustration } from "@/components/WelcomeDoctorIllustration";
import { LOGO_HEIGHT } from "@/constants/brand";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";

export default function WelcomeScreenWeb() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop, isTablet, isWide } = useWebLayout();
  const dir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const contentMaxWidth = isWide
    ? WEB_MAX_WIDTH.wide
    : isDesktop
      ? WEB_MAX_WIDTH.content
      : isTablet
        ? 760
        : "100%";

  return (
    <WebAuthBackground>
      <View style={[styles.shell, { maxWidth: contentMaxWidth }]}>
          <View style={[styles.topBar, { flexDirection: dir }]}>
            {!isDesktop ? (
              <Logo3elagi
                height={isTablet ? LOGO_HEIGHT.welcomeBarTablet : LOGO_HEIGHT.welcomeBarMobile}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <AuthLanguageField />
          </View>

          <View
            style={[
              styles.content,
              isDesktop && {
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 56,
              },
            ]}
          >
            {isDesktop ? (
              <View style={[styles.copyCol, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Logo3elagi height={LOGO_HEIGHT.welcomeDesktop} />
                <Text style={[styles.headline, { color: colors.foreground, textAlign }]}>
                  {t.auth.healthcareHub}
                </Text>
                <Text style={[styles.description, { color: colors.mutedForeground, textAlign }]}>
                  {t.auth.healthcareHubDesc}
                </Text>
              </View>
            ) : null}

            <View style={styles.mainCol}>
              {!isDesktop && !isTablet ? (
                <View style={styles.logoMobile}>
                  <Logo3elagi height={LOGO_HEIGHT.welcomeHero} centered />
                </View>
              ) : null}

              <View style={[styles.illustrationWrap, isDesktop && styles.illustrationDesktop]}>
                <WelcomeDoctorIllustration rtl={isRTL} />
              </View>

              <View
                style={[
                  styles.actions,
                  {
                    maxWidth: isDesktop ? 420 : 560,
                    alignSelf: "center",
                  },
                ]}
              >
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
      </View>
    </WebAuthBackground>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    minHeight: "100%",
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingVertical: 32,
    gap: 24,
  },
  topBar: {
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    width: "100%",
    minHeight: 560,
    justifyContent: "center",
  },
  copyCol: {
    flex: 1,
    gap: 20,
    maxWidth: 520,
  },
  headline: {
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 48,
    marginTop: 8,
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 480,
  },
  mainCol: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    gap: 24,
    justifyContent: "center",
  },
  logoMobile: {
    alignItems: "center",
    marginBottom: 8,
  },
  illustrationWrap: {
    flex: 1,
    width: "100%",
    minHeight: 280,
    maxHeight: 460,
  },
  illustrationDesktop: {
    minHeight: 380,
    maxHeight: 560,
  },
  actions: {
    gap: 14,
    width: "100%",
  },
  btnPrimary: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.2,
  },
  btnGhost: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1.5,
  },
  btnGhostText: { fontWeight: "800", fontSize: 17 },
});
