import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { CalendarClock, Coins, ShieldCheck, Video } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { WelcomeDoctorIllustration } from "@/components/WelcomeDoctorIllustration";
import { BRAND_SCROLL_NATIVE_ID } from "@/components/web/globalWebStyles";
import { primaryButton, surfaceCard, UI } from "@/constants/uiTokens";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { alignText, flexRow } from "@/utils/rtl";

export default function ForDoctorsScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);

  const perks = [
    { icon: Video, text: t.landing.forDoctorsPerk1 },
    { icon: CalendarClock, text: t.landing.forDoctorsPerk2 },
    { icon: Coins, text: t.landing.forDoctorsPerk3 },
    { icon: ShieldCheck, text: t.landing.forDoctorsPerk4 },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader />
      <ScrollView
        nativeID={BRAND_SCROLL_NATIVE_ID}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
      >
        <View style={[styles.hero, isDesktop && { flexDirection: dir }]}>
          <View style={styles.copy}>
            <Text style={[styles.headline, { color: colors.foreground, textAlign }]}>
              {t.landing.forDoctorsHeadline}
            </Text>
            <Text style={[styles.body, { color: colors.mutedForeground, textAlign }]}>
              {t.landing.forDoctorsBody}
            </Text>
            <Pressable
              onPress={() => router.push({ pathname: "/auth/signup", params: { role: "doctor" } })}
              style={({ pressed }) => [
                primaryButton(),
                styles.cta,
                { backgroundColor: colors.primary, opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
                {t.landing.forDoctorsCta}
              </Text>
            </Pressable>
          </View>
          <View style={[styles.visual, surfaceCard(colors.card, colors.border)]}>
            {Platform.OS === "web" ? (
              <WelcomeDoctorIllustration rtl={isRTL} />
            ) : (
              <LinearGradient colors={[`${colors.primary}22`, colors.accent]} style={styles.fill}>
                <Text style={{ fontSize: 64, textAlign: "center" }}>👨‍⚕️</Text>
              </LinearGradient>
            )}
          </View>
        </View>

        <View style={[styles.card, surfaceCard(colors.card, colors.border)]}>
          {perks.map(({ icon: Icon, text }) => (
            <View key={text} style={[styles.perkRow, { flexDirection: dir }]}>
              <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}14` }]}>
                <Icon size={18} color={colors.primary} />
              </View>
              <Text style={[styles.perkText, { color: colors.foreground, textAlign, flex: 1 }]}>
                {text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  hero: {
    gap: 16,
    alignItems: "center",
  },
  copy: {
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  cta: {
    alignSelf: "flex-start",
    paddingHorizontal: 22,
    marginTop: 4,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
  },
  visual: {
    flex: 1,
    width: "100%",
    minHeight: 220,
    maxHeight: 320,
    overflow: "hidden",
    borderRadius: UI.radius.xl,
  },
  fill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },
  card: {
    padding: UI.space.md,
    gap: 14,
  },
  perkRow: {
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  perkText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});
