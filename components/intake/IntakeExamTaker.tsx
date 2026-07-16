import { Audio } from "expo-av";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Play, Trash2, Upload } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppTextInput } from "@/components/AppTextInput";
import { ContainedVideo } from "@/components/chat/ContainedVideo";
import { FullscreenImageViewer } from "@/components/FullscreenImageViewer";
import { FullscreenVideoViewer } from "@/components/FullscreenVideoViewer";
import { uploadFile } from "@/domains/medical/api";
import type { IntakeQuestion } from "@/domains/intake-exams/types";
import { useColors } from "@/hooks/useColors";

interface Props {
  isRTL: boolean;
  questions: IntakeQuestion[];
  answers: Record<string, string[]>;
  readOnly?: boolean;
  previewMode?: boolean;
  accessToken?: string;
  onChange: (answers: Record<string, string[]>) => void;
}

type MediaKind = "image" | "video" | "audio";

function isMediaType(type: IntakeQuestion["type"]): type is MediaKind {
  return type === "image" || type === "video" || type === "audio";
}

export function IntakeExamTaker({
  isRTL,
  questions,
  answers,
  readOnly = false,
  previewMode = false,
  accessToken,
  onChange,
}: Props) {
  const colors = useColors();
  const textAlign = isRTL ? "right" : "left";
  const rowDir = isRTL ? "row-reverse" : "row";
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [zoomImageUri, setZoomImageUri] = useState<string | null>(null);
  const [zoomVideoUri, setZoomVideoUri] = useState<string | null>(null);

  const setAnswer = useCallback(
    (questionId: string, values: string[]) => {
      if (readOnly) return;
      onChange({ ...answers, [questionId]: values });
    },
    [answers, onChange, readOnly],
  );

  const clearAnswer = (questionId: string) => {
    if (readOnly) return;
    Alert.alert(
      isRTL ? "حذف المرفق" : "Remove attachment",
      isRTL ? "هل تريد حذف هذا المرفق؟" : "Remove this uploaded file?",
      [
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: isRTL ? "حذف" : "Delete",
          style: "destructive",
          onPress: () => setAnswer(questionId, []),
        },
      ],
    );
  };

  const uploadMedia = async (
    questionId: string,
    uri: string,
    mimeType: string,
    fileName: string,
    webFile?: File | Blob,
  ) => {
    if (!accessToken) {
      Alert.alert(
        isRTL ? "غير مسجل" : "Not signed in",
        isRTL ? "أعد تسجيل الدخول ثم حاول مرة أخرى." : "Sign in again and try once more.",
      );
      return;
    }
    setUploadingQuestionId(questionId);
    try {
      const uploaded = await uploadFile(uri, mimeType, fileName, accessToken, webFile);
      if (!uploaded?.url) {
        throw new Error(isRTL ? "لم يتم إرجاع رابط الملف." : "Upload returned no file URL.");
      }
      setAnswer(questionId, [uploaded.url]);
    } catch (e) {
      Alert.alert(isRTL ? "فشل الرفع" : "Upload failed", (e as Error).message);
    } finally {
      setUploadingQuestionId(null);
    }
  };

  const pickFromLibrary = async (questionId: string, kind: "image" | "video") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        isRTL ? "لا يوجد إذن" : "Permission needed",
        isRTL
          ? "اسمح بالوصول إلى المعرض لرفع الملفات."
          : "Allow photo library access to upload files.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        kind === "image"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mime =
      asset.mimeType ??
      (kind === "image" ? "image/jpeg" : "video/mp4");
    const name =
      asset.fileName ??
      (kind === "image" ? `exam-image-${Date.now()}.jpg` : `exam-video-${Date.now()}.mp4`);
    const webFile =
      Platform.OS === "web" ? (asset as { file?: File }).file : undefined;
    await uploadMedia(questionId, asset.uri, mime, name, webFile);
  };

  const recordAudio = async (questionId: string) => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          isRTL ? "لا يوجد إذن" : "Permission needed",
          isRTL ? "اسمح بالوصول إلى الميكروفون." : "Allow microphone access to record audio.",
        );
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      Alert.alert(
        isRTL ? "تسجيل صوت" : "Record audio",
        isRTL ? "اضغط إيقاف وحفظ عند الانتهاء." : "Press Stop & save when finished.",
        [
          {
            text: isRTL ? "إيقاف وحفظ" : "Stop & save",
            onPress: () => {
              void (async () => {
                try {
                  await recording.stopAndUnloadAsync();
                  const uri = recording.getURI();
                  if (!uri) return;
                  let webFile: File | Blob | undefined;
                  if (Platform.OS === "web") {
                    const res = await fetch(uri);
                    webFile = await res.blob();
                  }
                  await uploadMedia(
                    questionId,
                    uri,
                    "audio/m4a",
                    `exam-audio-${Date.now()}.m4a`,
                    webFile,
                  );
                } catch (e) {
                  Alert.alert(isRTL ? "خطأ" : "Error", (e as Error).message);
                }
              })();
            },
          },
          {
            text: isRTL ? "إلغاء" : "Cancel",
            style: "cancel",
            onPress: () => {
              void recording.stopAndUnloadAsync().catch(() => undefined);
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert(isRTL ? "خطأ" : "Error", (e as Error).message);
    }
  };

  const playAudio = async (questionId: string, uri: string) => {
    if (playingAudioId === questionId) return;
    setPlayingAudioId(questionId);
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudioId(null);
          void sound.unloadAsync();
        }
      });
      await sound.playAsync();
    } catch (e) {
      setPlayingAudioId(null);
      Alert.alert(isRTL ? "تعذر التشغيل" : "Playback failed", (e as Error).message);
    }
  };

  const mediaActionLabel = (kind: MediaKind, hasValue: boolean) => {
    if (kind === "image") {
      return hasValue
        ? isRTL
          ? "استبدال الصورة"
          : "Replace image"
        : isRTL
          ? "رفع صورة"
          : "Upload image";
    }
    if (kind === "video") {
      return hasValue
        ? isRTL
          ? "استبدال الفيديو"
          : "Replace video"
        : isRTL
          ? "رفع فيديو"
          : "Upload video";
    }
    return hasValue
      ? isRTL
        ? "استبدال التسجيل"
        : "Replace audio"
      : isRTL
        ? "تسجيل صوت"
        : "Record audio";
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
        const mediaUrl = value[0] ?? "";
        const uploading = uploadingQuestionId === q.id;
        const mediaKind = isMediaType(q.type) ? q.type : null;

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
              <AppTextInput
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
                      style={[styles.optionRow, { flexDirection: rowDir }]}
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
                      style={[styles.optionRow, { flexDirection: rowDir }]}
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

            {mediaKind ? (
              <View style={{ gap: 10, marginTop: 8 }}>
                {mediaUrl ? (
                  <View
                    style={[
                      styles.previewCard,
                      { borderColor: colors.border, backgroundColor: colors.muted },
                    ]}
                  >
                    {mediaKind === "image" ? (
                      <Pressable onPress={() => setZoomImageUri(mediaUrl)}>
                        <Image
                          source={{ uri: mediaUrl }}
                          style={styles.imagePreview}
                          contentFit="cover"
                        />
                        <Text
                          style={[
                            styles.previewHint,
                            { color: colors.primary, textAlign },
                          ]}
                        >
                          {isRTL ? "اضغط للتكبير" : "Tap to enlarge"}
                        </Text>
                      </Pressable>
                    ) : null}

                    {mediaKind === "video" ? (
                      <View style={{ gap: 8 }}>
                        <ContainedVideo
                          uri={mediaUrl}
                          width={280}
                          height={180}
                          controls
                        />
                        <Pressable onPress={() => setZoomVideoUri(mediaUrl)}>
                          <Text
                            style={[
                              styles.previewHint,
                              { color: colors.primary, textAlign },
                            ]}
                          >
                            {isRTL ? "فتح بملء الشاشة" : "Open fullscreen"}
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}

                    {mediaKind === "audio" ? (
                      <Pressable
                        onPress={() => void playAudio(q.id, mediaUrl)}
                        style={[styles.audioPlayBtn, { flexDirection: rowDir }]}
                      >
                        {playingAudioId === q.id ? (
                          <ActivityIndicator color={colors.primary} />
                        ) : (
                          <Play size={18} color={colors.primary} fill={colors.primary} />
                        )}
                        <Text style={{ color: colors.primary, fontWeight: "700" }}>
                          {playingAudioId === q.id
                            ? isRTL
                              ? "جاري التشغيل…"
                              : "Playing…"
                            : isRTL
                              ? "تشغيل التسجيل"
                              : "Play recording"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : readOnly ? (
                  <Text style={{ color: colors.mutedForeground, textAlign }}>
                    {isRTL ? "لا توجد إجابة" : "No answer"}
                  </Text>
                ) : null}

                {!readOnly ? (
                  previewMode ? (
                    <View style={[styles.mediaBtn, { borderColor: colors.border, opacity: 0.7 }]}>
                      <Text style={{ color: colors.mutedForeground, fontWeight: "600", textAlign }}>
                        {mediaActionLabel(mediaKind, false)} ({isRTL ? "معاينة فقط" : "preview only"})
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.mediaActions, { flexDirection: rowDir }]}>
                      <Pressable
                        onPress={() =>
                          void (mediaKind === "audio"
                            ? recordAudio(q.id)
                            : pickFromLibrary(q.id, mediaKind))
                        }
                        disabled={uploading}
                        style={[
                          styles.mediaBtn,
                          styles.mediaBtnGrow,
                          {
                            borderColor: colors.primary,
                            flexDirection: rowDir,
                            opacity: uploading ? 0.7 : 1,
                          },
                        ]}
                      >
                        {uploading ? (
                          <ActivityIndicator color={colors.primary} />
                        ) : (
                          <>
                            <Upload size={16} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontWeight: "700" }}>
                              {mediaActionLabel(mediaKind, !!mediaUrl)}
                            </Text>
                          </>
                        )}
                      </Pressable>

                      {mediaUrl ? (
                        <Pressable
                          onPress={() => clearAnswer(q.id)}
                          disabled={uploading}
                          style={[
                            styles.mediaBtn,
                            {
                              borderColor: colors.destructive,
                              flexDirection: rowDir,
                            },
                          ]}
                          accessibilityLabel={isRTL ? "حذف" : "Delete"}
                        >
                          <Trash2 size={16} color={colors.destructive} />
                          <Text style={{ color: colors.destructive, fontWeight: "700" }}>
                            {isRTL ? "حذف" : "Delete"}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  )
                ) : null}
              </View>
            ) : null}

            {readOnly &&
            q.type !== "image" &&
            q.type !== "video" &&
            q.type !== "audio" &&
            q.type !== "text" ? (
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

      <FullscreenImageViewer uri={zoomImageUri} onClose={() => setZoomImageUri(null)} />
      <FullscreenVideoViewer uri={zoomVideoUri} onClose={() => setZoomVideoUri(null)} />
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
  previewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: "#0f172a22",
  },
  previewHint: { fontSize: 12, fontWeight: "600", marginTop: 6 },
  audioPlayBtn: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  mediaActions: {
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  mediaBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mediaBtnGrow: {
    flexGrow: 1,
    minWidth: 140,
  },
});
