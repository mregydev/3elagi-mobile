import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuthStore } from "@/domains/auth/store";
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

  return (
    <View style={styles.form}>
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
    <View style={styles.field}>
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
  form: { width: "100%", gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  btn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    cursor: "pointer" as "auto",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  switchLink: {
    paddingVertical: 8,
    alignItems: "center",
    cursor: "pointer" as "auto",
  },
});
