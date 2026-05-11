import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
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
import { useMedicalStore } from "@/domains/medical/store";
import type { MedicalCategory } from "@/domains/medical/types";
import { useColors } from "@/hooks/useColors";

const CATEGORIES: { key: MedicalCategory; label: string }[] = [
  { key: "symptom", label: "Symptom" },
  { key: "lab", label: "Lab result" },
  { key: "xray", label: "X-ray / scan" },
  { key: "intake", label: "Intake exam" },
];

export default function AddMedicalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { category: categoryParam } = useLocalSearchParams<{ category?: MedicalCategory }>();
  const profile = useAuthStore((s) => s.profile);
  const add = useMedicalStore((s) => s.add);
  const [category, setCategory] = useState<MedicalCategory>(
    CATEGORIES.some((c) => c.key === categoryParam) ? categoryParam! : "symptom"
  );
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!profile) {
      Alert.alert("Sign in first");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Title required");
      return;
    }
    add({
      ownerId: profile.id,
      category,
      title: title.trim(),
      value: value.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Add to history
        </Text>
        <Pressable onPress={submit} style={{ padding: 4 }}>
          <Text style={[styles.save, { color: colors.primary }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          Category
        </Text>
        <View style={styles.catRow}>
          {CATEGORIES.map((c) => {
            const sel = category === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: sel ? colors.primary : colors.card,
                    borderColor: sel ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: sel ? "#fff" : colors.foreground,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Field
          label="Title"
          value={title}
          onChange={setTitle}
          placeholder="e.g. Headache, CBC, Chest X-ray"
          colors={colors}
        />
        <Field
          label="Value (optional)"
          value={value}
          onChange={setValue}
          placeholder="e.g. Mild, WBC: 11.2, Normal"
          colors={colors}
        />
        <Field
          label="Notes (optional)"
          value={notes}
          onChange={setNotes}
          placeholder="Any extra context"
          multiline
          colors={colors}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        style={[
          styles.input,
          multiline && { minHeight: 100, textAlignVertical: "top" },
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  save: { fontSize: 15, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "700" },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});
