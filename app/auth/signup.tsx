import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const signup = useAuthStore((s) => s.signup);
  const loading = useAuthStore((s) => s.loading);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      Alert.alert(
        "Missing info",
        "Name, email and a 6+ char password are required.",
      );
      return;
    }
    try {
      await signup({ name, email, phone, password });
      router.back();
    } catch (e) {
      Alert.alert("Signup failed", (e as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12 }}>
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Create your account
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Save your medical history & chat with doctors
        </Text>

        <View style={{ width: "100%", gap: 12, marginTop: 28 }}>
          <Field label="Full name" value={name} onChange={setName} colors={colors} />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            colors={colors}
          />
          <Field
            label="Phone"
            value={phone}
            onChange={setPhone}
            keyboardType="phone-pad"
            colors={colors}
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            secure
            colors={colors}
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
              <Text style={styles.btnText}>Sign up</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.replace("/auth/login")}
            style={{ paddingVertical: 8, alignItems: "center" }}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              Already have an account? Log in
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  secure,
  colors,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  colors: ReturnType<typeof useColors>;
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
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground,
          },
        ]}
        placeholderTextColor={colors.mutedForeground}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 24, alignItems: "center" },
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
