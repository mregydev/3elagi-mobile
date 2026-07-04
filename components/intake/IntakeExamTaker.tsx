import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { uploadFile } from "@/domains/medical/api";
import type { IntakeQuestion } from "@/domains/intake-exams/types";
import { useColors } from "@/hooks/useColors";

interface Props {
  isRTL: boolean;
  questions: IntakeQuestion[];
  answers: Record<string, string[]>;
  readOnly?: boolean;
  accessToken?: string;
  onChange: (answers: Record<string, string[]>) => void;
}

export function IntakeExamTaker({
  isRTL,
  questions,
  answers,
  readOnly = false,
  accessToken,
  onChange,
}: Props) {
  const colors = useColors();
  const textAlign = isRTL ? "right" : "left";
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);

  const setAnswer = useCallback(
    (questionId: string, values: string[]) => {
      if (readOnly) return;
      onChange({ ...answers, [questionId]: values });
    },
    [answers, onChange, readOnly],
  );

  const uploadMedia = async (
    questionId: string,
    uri: string,
    mimeType: string,
    fileName: string,
    webFile?: File | Blob,
  ) => {
    if (!accessToken) return;
    setUploadingQuestionId(questionId);
    try {
      const uploaded = await uploadFile(uri, mimeType, fileName, accessToken, webFile);
      setAnswer(questionId, [uploaded.url]);
    } catch (e) {
      Alert.alert(isRTL ? "فشل الرفع" : "Upload failed", (e as Error).message);
    } finally {
      setUploadingQuestionId(null);
    }
  };

  const pickVideo = async (questionId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadMedia(
      questionId,
      asset.uri,
      asset.mimeType ?? "video/mp4",
      asset.fileName ?? "exam-video.mp4",
      Platform.OS === "web" ? (asset as { file?: File }).file : undefined,
    );
  };

  const recordAudio = async (questionId: string) => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      Alert.alert(
        isRTL ? "تسجيل صوت" : "Record audio",
        isRTL ? "اضغط OK عند الانتهاء." : "Press OK when finished recording.",
        [
          {
            text: isRTL ? "إيقاف وحفظ" : "Stop & save",
            onPress: () => {
              void (async () => {
                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                if (!uri) return;
                await uploadMedia(questionId, uri, "audio/m4a", "exam-audio.m4a");
              })();
            },
          },
          {
            text: isRTL ? "إلغاء" : "Cancel",
            style: "cancel",
            onPress: () => {
              void recording.stopAndUnloadAsync();
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert(isRTL ? "خطأ" : "Error", (e as Error).message);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      {questions.map((q, index) => {
        if (q.type === "guidance") {
          return (
            <View
              key={q.id}
              style={[styles.card, { backgroundColor: `${colors.primary}10`, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.foreground, textAlign }}>{q.text}</Text>
            </View>
          );
        }

        const value = answers[q.id] ?? [];
        const uploading = uploadingQuestionId === q.id;

        return (
          <View
            key={q.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.foreground, fontWeight: "700", textAlign }}>
              {index + 1}. {q.text}
              {q.required ? " *" : ""}
            </Text>

            {q.type === "text" ? (
              <TextInput
                value={value[0] ?? ""}
                onChangeText={(text) => setAnswer(q.id, text ? [text] : [])}
                editable={!readOnly}
                multiline
                placeholder={isRTL ? "اكتب إجابتك" : "Type your answer"}
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  { color: colors.foreground, borderColor: colors.border, textAlign },
                ]}
              />
            ) : null}

            {q.type === "single_choice"
              ? q.options.map((opt) => {
                  const selected = value[0] === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      disabled={readOnly}
                      onPress={() => setAnswer(q.id, [opt.id])}
                      style={[styles.optionRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                    >
                      <View
                        style={[
                          styles.radio,
                          {
                            borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? colors.primary : "transparent",
                          },
                        ]}
                      />
                      <Text style={{ color: colors.foreground, flex: 1, textAlign }}>{opt.text}</Text>
                    </Pressable>
                  );
                })
              : null}

            {q.type === "multi_choice"
              ? q.options.map((opt) => {
                  const selected = value.includes(opt.id);
                  return (
                    <Pressable
                      key={opt.id}
                      disabled={readOnly}
                      onPress={() => {
                        const next = selected
                          ? value.filter((v) => v !== opt.id)
                          : [...value, opt.id];
                        setAnswer(q.id, next);
                      }}
                      style={[styles.optionRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? colors.primary : "transparent",
                          },
                        ]}
                      />
                      <Text style={{ color: colors.foreground, flex: 1, textAlign }}>{opt.text}</Text>
                    </Pressable>
                  );
                })
              : null}

            {q.type === "video" || q.type === "audio" ? (
              <View style={{ gap: 8, marginTop: 8 }}>
                {!readOnly ? (
                  <Pressable
                    onPress={() =>
                      void (q.type === "video" ? pickVideo(q.id) : recordAudio(q.id))
                    }
                    disabled={uploading}
                    style={[styles.mediaBtn, { borderColor: colors.primary }]}
                  >
                    {uploading ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Text style={{ color: colors.primary, fontWeight: "700" }}>
                        {q.type === "video"
                          ? isRTL
                            ? "رفع / تسجيل فيديو"
                            : "Upload / record video"
                          : isRTL
                            ? "تسجيل صوت"
                            : "Record audio"}
                      </Text>
                    )}
                  </Pressable>
                ) : null}
                {value[0] ? (
                  <Pressable onPress={() => void Linking.openURL(value[0])}>
                    <Text style={{ color: colors.primary, textAlign }}>
                      {isRTL ? "فتح المرفق" : "Open attachment"}
                    </Text>
                  </Pressable>
                ) : readOnly ? (
                  <Text style={{ color: colors.mutedForeground, textAlign }}>
                    {isRTL ? "لا توجد إجابة" : "No answer"}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {readOnly && q.type !== "video" && q.type !== "audio" && q.type !== "text" ? (
              <Text style={{ color: colors.mutedForeground, marginTop: 6, textAlign }}>
                {value.length
                  ? q.options
                      .filter((o) => value.includes(o.id))
                      .map((o) => o.text)
                      .join(", ")
                  : isRTL
                    ? "لا توجد إجابة"
                    : "No answer"}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 72,
    textAlignVertical: "top",
    marginTop: 8,
  },
  optionRow: { alignItems: "center", gap: 10, marginTop: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2 },
  mediaBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
});
