import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { AuthLanguageField } from "@/components/auth/AuthLanguageField";
import { AuthLoginBackground } from "@/components/auth/AuthLoginBackground";
import { AuthFormError, AuthFormField } from "@/components/auth/AuthFormField";
import { useAuthStore } from "@/domains/auth/store";
import { getPostAuthRoute } from "@/domains/auth/navigation";
import {
  hasFieldErrors,
  validateLoginFields,
  type LoginFieldErrors,
} from "@/domains/auth/validation";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { WEB_MOBILE_AUTH_EXTRA_BOTTOM_PADDING } from "@/constants/webLayout";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { isDesktop, isMobile } = useWebLayout();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const hideIntro = Platform.OS === "web" && isDesktop;
  const hideWebTopBar = Platform.OS === "web";

  const submit = async () => {
    const errors = validateLoginFields(email, password, t.auth);
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    try {
      await login({ email: email.trim(), password });
      const { role, doctorApprovalStatus } = useAuthStore.getState();
      router.replace(getPostAuthRoute(role, doctorApprovalStatus));
    } catch (e) {
      const message = (e as Error).message;
      if (message === "__UNSUPPORTED_ROLE__") {
        setFormError(t.auth.unsupportedAccountMsg);
      } else {
        setFormError(message || t.auth.invalidCredentials);
      }
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
              paddingTop: Platform.OS === "web" ? 16 : insets.top + 8,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
            <ArrowLeft size={22} color={colors.foreground} />
          </Pressable>
          <AuthLanguageField />
        </View>
      ) : null}
      <KeyboardSafeScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.body,
          Platform.OS === "web" && isMobile && styles.bodyMobileWeb,
        ]}
        bottomOffset={32}
      >
        {!hideIntro ? (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t.auth.welcomeBack}
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              {t.auth.signInSubtitle}
            </Text>
          </>
        ) : null}

        <View style={{ width: "100%", gap: 12, marginTop: hideIntro ? 0 : 28 }}>
          {formError ? <AuthFormError message={formError} colors={colors} /> : null}
          <AuthFormField
            label={t.auth.email}
            value={email}
            onChange={(value) => {
              setEmail(value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              if (formError) setFormError(null);
            }}
            error={fieldErrors.email}
            placeholder={t.auth.emailPlaceholder}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
            colors={colors}
            isRTL={isRTL}
          />
          <AuthFormField
            ref={passwordRef}
            label={t.auth.password}
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              if (formError) setFormError(null);
            }}
            error={fieldErrors.password}
            placeholder={t.auth.passwordPlaceholder}
            secure
            returnKeyType="go"
            onSubmitEditing={() => {
              if (!loading) void submit();
            }}
            colors={colors}
            isRTL={isRTL}
          />
          <Pressable
            onPress={submit}
            disabled={loading}
            style={[
              styles.btn,
              {
                backgroundColor: loading
                  ? colors.mutedForeground
                  : colors.primary,
                marginTop: 8,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t.auth.logIn}</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.replace("/auth/signup")}
            style={{ paddingVertical: 8, alignItems: "center" }}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              {t.auth.noAccountSignUp}
            </Text>
          </Pressable>
        </View>
      </KeyboardSafeScrollView>
    </View>
  );

  if (Platform.OS === "web") {
    return screen;
  }

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
  body: { padding: 24, alignItems: "center", paddingBottom: Platform.OS === "web" ? 32 : 24 },
  bodyMobileWeb: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 28, fontWeight: "800" },
  sub: { fontSize: 14, marginTop: 4 },
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
