import { router } from "expo-router";
import { AppBackButton } from "@/components/nav/AppBackButton";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { AuthLanguageField } from "@/components/auth/AuthLanguageField";
import { AuthLoginBackground } from "@/components/auth/AuthLoginBackground";
import { AuthFormError, AuthFormField } from "@/components/auth/AuthFormField";
import { authRepository } from "@/domains/auth/repository";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { showSuccessToast } from "@/utils/toast";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { isDesktop, isMobile } = useWebLayout();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const hideIntro = Platform.OS === "web" && isDesktop;
  const hideWebTopBar = Platform.OS === "web";

  const submit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setFormError(t.auth.invalidEmail);
      return;
    }
    setFormError(null);
    setLoading(true);
    try {
      await authRepository.forgotPassword(trimmed);
      setSent(true);
      showSuccessToast(t.auth.resetLinkSent);
    } catch (e) {
      setFormError((e as Error).message || t.auth.genericError);
    } finally {
      setLoading(false);
    }
  };

  const screen = (
    <View
      style={[
        styles.screen,
        { backgroundColor: "transparent" },
        Platform.OS === "web" && styles.screenWeb,
      ]}
    >
      {!hideWebTopBar ? (
        <View
          style={[
            styles.topBar,
            {
              paddingTop: Platform.OS === "web" ? 8 : insets.top + 4,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <AppBackButton color={colors.foreground} style={{ padding: 6 }} />
          <AuthLanguageField />
        </View>
      ) : null}
      <KeyboardSafeScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.body,
          Platform.OS === "web" && isMobile && styles.bodyMobileWeb,
          // Desktop web may vertically center; mobile keeps content at the top.
          Platform.OS === "web" && !isMobile && styles.bodyDesktopWebCentered,
        ]}
        bottomOffset={32}
      >
        {!hideIntro ? (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t.auth.forgotPasswordTitle}
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              {t.auth.forgotPasswordSubtitle}
            </Text>
          </>
        ) : null}

        <View style={{ width: "100%", gap: 12, marginTop: hideIntro ? 0 : 28 }}>
          {formError ? <AuthFormError message={formError} colors={colors} /> : null}
          {sent ? (
            <Text style={{ color: colors.foreground, textAlign: "center", lineHeight: 22 }}>
              {t.auth.resetLinkSentDetail}
            </Text>
          ) : (
            <>
              <AuthFormField
                label={t.auth.email}
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  if (formError) setFormError(null);
                }}
                placeholder={t.auth.emailPlaceholder}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="go"
                onSubmitEditing={() => {
                  if (!loading) void submit();
                }}
                colors={colors}
                isRTL={isRTL}
              />
              <Pressable
                onPress={() => void submit()}
                disabled={loading}
                style={[
                  styles.btn,
                  {
                    backgroundColor: loading ? colors.mutedForeground : colors.primary,
                    marginTop: 8,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>{t.auth.sendResetLink}</Text>
                )}
              </Pressable>
            </>
          )}
          <Pressable
            onPress={() => router.replace("/auth/login")}
            style={{ paddingVertical: 8, alignItems: "center" }}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              {t.auth.backToLogin}
            </Text>
          </Pressable>
        </View>
      </KeyboardSafeScrollView>
    </View>
  );

  if (Platform.OS === "web") return screen;
  return <AuthLoginBackground>{screen}</AuthLoginBackground>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  screenWeb: { flex: 0, width: "100%", height: "auto" },
  topBar: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: "center",
    paddingBottom: Platform.OS === "web" ? 32 : 24,
  },
  bodyMobileWeb: { paddingHorizontal: 16, paddingTop: 8 },
  bodyDesktopWebCentered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  sub: { fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 },
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
