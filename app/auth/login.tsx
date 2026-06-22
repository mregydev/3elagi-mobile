import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const hideIntro = Platform.OS === "web" && isDesktop;
  const hideWebTopBar = Platform.OS === "web";

  const submit = async () => {
    try {
      await login({ email, password });
      router.replace("/(tabs)");
    } catch (e) {
      if ((e as Error).message === "__UNSUPPORTED_ROLE__") {
        Alert.alert(t.auth.unsupportedAccount, t.auth.unsupportedAccountMsg, [
          { text: t.common.ok },
        ]);
      } else {
        Alert.alert(t.auth.loginFailed, (e as Error).message);
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
      <KeyboardSafeScrollView style={styles.flex} contentContainerStyle={styles.body} bottomOffset={32}>
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
          <Field
            label={t.auth.email}
            value={email}
            onChange={setEmail}
            placeholder={t.auth.emailPlaceholder}
            autoCapitalize="none"
            keyboardType="email-address"
            colors={colors}
            isRTL={isRTL}
          />
          <Field
            label={t.auth.password}
            value={password}
            onChange={setPassword}
            placeholder={t.auth.passwordPlaceholder}
            secure
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

function Field({
  label,
  value,
  onChange,
  secure,
  colors,
  isRTL,
  placeholder,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences";
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        placeholder={placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground,
            textAlign: isRTL ? "right" : "left",
          },
        ]}
        placeholderTextColor={colors.mutedForeground}
        {...rest}
      />
    </View>
  );
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
  title: { fontSize: 28, fontWeight: "800" },
  sub: { fontSize: 14, marginTop: 4 },
  label: { fontSize: 13, fontWeight: "700" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
