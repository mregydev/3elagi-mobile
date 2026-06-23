import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  secure?: boolean;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences";
  keyboardType?: "default" | "email-address" | "phone-pad";
  returnKeyType?: "next" | "go" | "done";
  blurOnSubmit?: boolean;
  onSubmitEditing?: () => void;
}

export const AuthFormField = React.forwardRef<TextInput, Props>(function AuthFormField(
  {
    label,
    value,
    onChange,
    error,
    secure,
    colors,
    isRTL,
    placeholder,
    ...rest
  },
  ref,
) {
  const borderColor = error ? colors.destructive : colors.border;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        placeholder={placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor,
            color: colors.foreground,
            textAlign: isRTL ? "right" : "left",
          },
        ]}
        placeholderTextColor={colors.mutedForeground}
        {...rest}
      />
      {error ? (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      ) : null}
    </View>
  );
});

export function AuthFormError({
  message,
  colors,
}: {
  message: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.formError, { backgroundColor: `${colors.destructive}18` }]}>
      <Text style={[styles.formErrorText, { color: colors.destructive }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6, width: "100%" },
  label: { fontSize: 13, fontWeight: "700" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  error: { fontSize: 12, fontWeight: "600" },
  formError: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "100%",
  },
  formErrorText: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
});
