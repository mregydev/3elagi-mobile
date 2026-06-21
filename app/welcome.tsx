import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo3elagi } from "@/components/Logo3elagi";
import { WelcomeDoctorIllustration } from "@/components/WelcomeDoctorIllustration";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

export default function WelcomeScreen() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const logoHeight = Math.min(84, screenWidth * 0.22);

  return (
    <LinearGradient
      colors={["#e8efff", "#f8fafc", "#ecfdf5"]}
      locations={[0, 0.5, 1]}
      style={styles.root}
    >
      <View style={[styles.blob, styles.blobTop, { backgroundColor: colors.primary }]} />
      <View style={[styles.blob, styles.blobBottom, { backgroundColor: colors.success }]} />

      <View
        style={[
          styles.page,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <View style={styles.logoHeader}>
          <Logo3elagi height={logoHeight} centered />
        </View>

        <View style={styles.illustrationWrap}>
          <WelcomeDoctorIllustration rtl={isRTL} />
        </View>

        <View style={styles.actions}>
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
            <Text style={styles.btnPrimaryText}>
              {isRTL ? "تسجيل الدخول" : "Log in"}
            </Text>
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
              {isRTL ? "إنشاء حساب" : "Create an account"}
            </Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logoHeader: {
    alignItems: "center",
    paddingBottom: 8,
  },
  illustrationWrap: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    paddingVertical: 4,
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.07,
  },
  blobTop: {
    width: 240,
    height: 240,
    top: -70,
    alignSelf: "center",
  },
  blobBottom: {
    width: 200,
    height: 200,
    bottom: 80,
    left: -80,
  },
  actions: {
    gap: 12,
    width: "100%",
    paddingHorizontal: 12,
    paddingTop: 12,
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
    borderWidth: 1.5,
  },
  btnGhostText: { fontWeight: "800", fontSize: 16 },
});
