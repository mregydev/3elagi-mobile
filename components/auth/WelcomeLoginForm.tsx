import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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

interface Props {
  onSwitchToSignup: () => void;
}

export function WelcomeLoginForm({ onSwitchToSignup }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

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

  return (
    <View style={styles.form}>
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
          { backgroundColor: loading ? colors.mutedForeground : colors.primary },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{t.auth.logIn}</Text>
        )}
      </Pressable>
      <Pressable onPress={onSwitchToSignup} style={styles.switchLink}>
        <Text style={{ color: colors.primary, fontWeight: "600" }}>
          {t.auth.noAccountSignUp}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { width: "100%", gap: 12 },
  btn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  switchLink: {
    paddingVertical: 8,
    alignItems: "center",
  },
});
