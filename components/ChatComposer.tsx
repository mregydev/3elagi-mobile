import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { ClipboardList, Mic, Paperclip, Send, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ChatAttachMenu } from "@/components/chat/ChatAttachMenu";
import { ChatAttachmentPreview } from "@/components/chat/ChatAttachmentPreview";
import { FullscreenImageViewer } from "@/components/FullscreenImageViewer";
import { FullscreenVideoViewer } from "@/components/FullscreenVideoViewer";
import { uploadFile } from "@/domains/medical/api";
import type { ChatMessage, SendMessageInput } from "@/domains/chat/types";
import {
  emitChatStopTyping,
  emitChatTyping,
} from "@/domains/presence/socket";
import { useColors } from "@/hooks/useColors";
import { handleEnterToSendMessage } from "@/utils/enterToSendMessage";
import {
  CHAT_VIDEO_PICKER_OPTIONS,
  getChatVideoLimitViolation,
} from "@/utils/chatVideoLimits";
import { chatFlexRow } from "@/utils/rtl";

interface Props {
  isRTL: boolean;
  isPatient: boolean;
  selfId: string;
  accessToken: string;
  peerId: string;
  sending: boolean;
  bottomInset: number;
  onSend: (input: SendMessageInput, replaceTempId?: string) => Promise<void>;
  onAddPending: (message: ChatMessage) => void;
  onFailPending: (tempId: string) => void;
  onPickMedical: () => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onComposerFocus?: () => void;
  disabled?: boolean;
  disabledHint?: string;
}

type PendingAttachment = {
  uri: string;
  mimeType: string;
  fileName: string;
  type: "image" | "video";
  webFile?: File | Blob;
};

function mimeFromUri(uri: string, fallback: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "m4a") return "audio/m4a";
  if (ext === "caf") return "audio/x-caf";
  if (ext === "3gp") return "audio/3gpp";
  if (ext === "aac") return "audio/aac";
  if (ext === "mp3") return "audio/mpeg";
  return fallback;
}

export function ChatComposer({
  isRTL,
  isPatient,
  selfId,
  accessToken,
  peerId,
  sending,
  bottomInset,
  onSend,
  onAddPending,
  onFailPending,
  onPickMedical,
  editingMessage = null,
  onCancelEdit,
  onEdit,
  onComposerFocus,
  disabled = false,
  disabledHint,
}: Props) {
  const colors = useColors();
  const [text, setText] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [attachMenuVisible, setAttachMenuVisible] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [previewVideoUri, setPreviewVideoUri] = useState<string | null>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const rowDir = chatFlexRow();

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    return () => {
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      if (isTypingRef.current) {
        emitChatStopTyping(peerId, selfId);
      }
      if (recordingRef.current) {
        void recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
      }
    };
  }, [peerId, selfId]);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
      stopTyping();
    }
  }, [editingMessage?.id]);

  const notifyTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitChatTyping(peerId, selfId);
    }
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      emitChatStopTyping(peerId, selfId);
    }, 2000);
  };

  const stopTyping = () => {
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emitChatStopTyping(peerId, selfId);
    }
  };

  const openAttachMenu = () => {
    setAttachMenuVisible(true);
  };

  const createPending = (
    type: ChatMessage["type"],
    localAttachmentUrl?: string,
    caption?: string,
  ): string => {
    const tempId = `pending-${Date.now()}`;
    const defaultLabel =
      type === "image"
        ? "Photo"
        : type === "voice"
          ? "Voice message"
          : type === "video"
            ? "Video"
            : "";
    const label = caption?.trim() || defaultLabel;
    onAddPending({
      id: tempId,
      conversationId: peerId,
      senderId: "me",
      text: label,
      createdAt: new Date().toISOString(),
      type,
      localAttachmentUrl: localAttachmentUrl ?? null,
      pending: true,
    });
    return tempId;
  };

  const uploadAndSend = async (
    uri: string,
    mimeType: string,
    fileName: string,
    type: "image" | "video" | "voice",
    webFile?: File | Blob,
    caption?: string,
  ) => {
    const tempId =
      type === "image" || type === "voice" || type === "video"
        ? createPending(type, type === "voice" ? undefined : uri, caption)
        : undefined;

    setUploading(true);
    try {
      const uploaded = await uploadFile(uri, mimeType, fileName, accessToken, webFile);
      await onSend(
        {
          recipientId: peerId,
          type,
          content: caption?.trim() || undefined,
          attachmentUrl: uploaded.url,
        },
        tempId,
      );
    } catch (e) {
      if (tempId) onFailPending(tempId);
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        e instanceof Error ? e.message : isRTL ? "تعذر إرسال الملف" : "Failed to send attachment",
      );
    } finally {
      setUploading(false);
    }
  };

  const queueAttachment = (
    asset: ImagePicker.ImagePickerAsset,
    media: "image" | "video",
  ) => {
    setPendingAttachment({
      uri: asset.uri,
      mimeType: asset.mimeType ?? (media === "image" ? "image/jpeg" : "video/mp4"),
      fileName:
        asset.fileName ?? `${media}-${Date.now()}.${media === "video" ? "mp4" : "jpg"}`,
      type: media,
      webFile: asset.file,
    });
  };

  const sendPendingAttachment = async () => {
    if (!pendingAttachment || sending || uploading) return;
    const caption = text.trim();
    const { uri, mimeType, fileName, type, webFile } = pendingAttachment;
    stopTyping();
    setPendingAttachment(null);
    setText("");
    await uploadAndSend(uri, mimeType, fileName, type, webFile, caption);
  };

  const pickGallery = async (media: "image" | "video") => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          isRTL ? "إذن مطلوب" : "Permission required",
          isRTL ? "يرجى السماح بالوصول إلى المعرض" : "Please allow gallery access.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: media === "image" ? ["images"] : ["videos"],
        quality: media === "image" ? 0.85 : CHAT_VIDEO_PICKER_OPTIONS.quality,
        allowsEditing: media === "image",
        ...(media === "video" ? CHAT_VIDEO_PICKER_OPTIONS : {}),
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (media === "video") {
        const violation = await getChatVideoLimitViolation(
          asset.duration ?? null,
          asset.uri,
          isRTL,
          asset.fileSize ?? null,
        );
        if (violation) {
          Alert.alert(violation.title, violation.body);
          return;
        }
      }
      queueAttachment(asset, media);
    } catch (e) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        e instanceof Error ? e.message : isRTL ? "تعذر فتح المعرض" : "Could not open gallery.",
      );
    }
  };

  const pickCamera = async (media: "image" | "video") => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          isRTL ? "إذن مطلوب" : "Permission required",
          isRTL ? "يرجى السماح بالوصول إلى الكاميرا" : "Please allow camera access.",
        );
        return;
      }

      if (media === "video" && Platform.OS !== "web") {
        const mic = await Audio.requestPermissionsAsync();
        if (mic.status !== "granted") {
          Alert.alert(
            isRTL ? "إذن مطلوب" : "Permission required",
            isRTL
              ? "يرجى السماح بالوصول إلى الميكروفون لتسجيل الفيديو"
              : "Please allow microphone access to record video.",
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: media === "image" ? ["images"] : ["videos"],
        quality: media === "image" ? 0.85 : CHAT_VIDEO_PICKER_OPTIONS.quality,
        allowsEditing: media === "image",
        ...(media === "video" ? CHAT_VIDEO_PICKER_OPTIONS : {}),
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (media === "video") {
        const violation = await getChatVideoLimitViolation(
          asset.duration ?? null,
          asset.uri,
          isRTL,
          asset.fileSize ?? null,
        );
        if (violation) {
          Alert.alert(violation.title, violation.body);
          return;
        }
      }
      queueAttachment(asset, media);
    } catch (e) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        e instanceof Error ? e.message : isRTL ? "تعذر فتح الكاميرا" : "Could not open camera.",
      );
    }
  };

  const prepareAudioMode = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
  };

  const toggleRecording = async () => {
    if (recording) {
      try {
        const startedAt = recordingStartedAt ?? Date.now();
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        setRecordingStartedAt(null);
        await prepareAudioMode();

        const durationMs = Date.now() - startedAt;
        if (!uri) {
          Alert.alert(
            isRTL ? "خطأ" : "Error",
            isRTL ? "تعذر حفظ التسجيل" : "Could not save recording.",
          );
          return;
        }
        if (durationMs < 800) {
          Alert.alert(
            isRTL ? "تسجيل قصير" : "Recording too short",
            isRTL ? "اضغط الميكروفون لفترة أطول" : "Hold the mic longer to record.",
          );
          return;
        }

        const mime = mimeFromUri(uri, Platform.OS === "ios" ? "audio/m4a" : "audio/mp4");
        const ext = uri.split(".").pop() ?? "m4a";
        await uploadAndSend(uri, mime, `voice-${Date.now()}.${ext}`, "voice");
      } catch (e) {
        setRecording(null);
        setRecordingStartedAt(null);
        Alert.alert(isRTL ? "خطأ" : "Error", (e as Error).message);
      }
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          isRTL ? "إذن مطلوب" : "Permission required",
          isRTL ? "يرجى السماح بالوصول إلى الميكروفون" : "Please allow microphone access.",
        );
        return;
      }

      await prepareAudioMode();

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      setRecordingStartedAt(Date.now());
    } catch (e) {
      setRecording(null);
      setRecordingStartedAt(null);
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        e instanceof Error ? e.message : isRTL ? "تعذر بدء التسجيل" : "Could not start recording.",
      );
    }
  };

  const sendText = async () => {
    const t = text.trim();
    if (!t || sending || uploading) return;
    stopTyping();

    if (editingMessage && onEdit) {
      await onEdit(editingMessage.id, t);
      setText("");
      onCancelEdit?.();
      return;
    }

    setText("");
    const tempId = createPending("text", undefined, t);

    try {
      await onSend({ recipientId: peerId, type: "text", content: t }, tempId);
    } catch {
      setText(t);
    }
  };

  const sendMessage = async () => {
    if (pendingAttachment) {
      await sendPendingAttachment();
      return;
    }
    await sendText();
  };

  const busy = sending || uploading || disabled;
  const isEditing = !!editingMessage;
  const controlsDisabled = busy || !!recording || isEditing;
  const canSend = !!text.trim() || !!pendingAttachment;

  if (disabled && !isEditing) {
    return (
      <View
        style={[
          styles.footer,
          styles.disabledBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: bottomInset + 12,
          },
        ]}
      >
        <Text style={{ color: colors.mutedForeground, textAlign: "center", fontSize: 13 }}>
          {disabledHint ?? (isRTL ? "المحادثة محظورة" : "Chat is blocked")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <ChatAttachMenu
        visible={attachMenuVisible}
        isRTL={isRTL}
        onClose={() => setAttachMenuVisible(false)}
        onPhotoGallery={() => void pickGallery("image")}
        onPhotoCamera={() => void pickCamera("image")}
        onVideoGallery={() => void pickGallery("video")}
        onVideoCamera={() => void pickCamera("video")}
      />

      {isEditing ? (
        <View
          style={[
            styles.editBar,
            {
              backgroundColor: colors.muted,
              borderTopColor: colors.border,
              flexDirection: rowDir,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.primary,
                fontWeight: "700",
                fontSize: 13,
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {isRTL ? "تعديل الرسالة" : "Editing message"}
            </Text>
          </View>
          <Pressable onPress={onCancelEdit} hitSlop={8}>
            <X size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ) : null}

      {pendingAttachment && !isEditing ? (
        <ChatAttachmentPreview
          attachment={{
            uri: pendingAttachment.uri,
            type: pendingAttachment.type,
          }}
          isRTL={isRTL}
          onRemove={() => setPendingAttachment(null)}
          onReplace={openAttachMenu}
          onExpandImage={setPreviewImageUri}
          onExpandVideo={setPreviewVideoUri}
        />
      ) : null}

      <FullscreenImageViewer
        uri={previewImageUri}
        onClose={() => setPreviewImageUri(null)}
      />
      <FullscreenVideoViewer
        uri={previewVideoUri}
        onClose={() => setPreviewVideoUri(null)}
      />

      <View
        style={[
          styles.composer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            flexDirection: rowDir,
            paddingBottom: bottomInset + 8,
          },
        ]}
      >
        {!isEditing ? (
          <View style={[styles.composerActions, { flexDirection: rowDir }]}>
            <Pressable
              onPress={openAttachMenu}
              disabled={controlsDisabled}
              accessibilityLabel={isRTL ? "إرفاق صورة أو فيديو" : "Attach photo or video"}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.muted,
                  opacity: controlsDisabled ? 0.45 : 1,
                },
              ]}
              hitSlop={6}
            >
              <Paperclip size={18} color={colors.mutedForeground} />
            </Pressable>

            {isPatient ? (
              <Pressable
                onPress={onPickMedical}
                disabled={controlsDisabled}
                accessibilityLabel={isRTL ? "مشاركة سجل طبي" : "Share medical record"}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: colors.muted,
                    opacity: controlsDisabled ? 0.45 : 1,
                  },
                ]}
                hitSlop={6}
              >
                <ClipboardList size={18} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <TextInput
          value={text}
          onChangeText={(value) => {
            setText(value);
            if (value.trim()) notifyTyping();
            else stopTyping();
          }}
          onFocus={onComposerFocus}
          onBlur={stopTyping}
          placeholder={
            pendingAttachment
              ? isRTL
                ? "أضف تعليقاً (اختياري)…"
                : "Add a caption (optional)…"
              : isRTL
                ? "اكتب رسالة…"
                : "Type a message…"
          }
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              backgroundColor: colors.muted,
              color: colors.foreground,
              textAlign: isRTL ? "right" : "left",
            },
          ]}
          multiline
          editable={!uploading && !disabled && !recording}
          blurOnSubmit={false}
          onKeyPress={(e) => handleEnterToSendMessage(e, sendMessage)}
        />

        {canSend ? (
          <Pressable
            onPress={() => void sendMessage()}
            disabled={busy}
            style={[styles.iconBtn, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}
          >
            <Send size={18} color="#fff" />
          </Pressable>
        ) : isEditing ? null : (
          <Pressable
            onPress={() => void toggleRecording()}
            disabled={uploading || sending || isEditing || !!pendingAttachment}
            style={[
              styles.iconBtn,
              {
                backgroundColor: recording ? "#ef4444" : colors.muted,
                opacity: uploading || sending || isEditing || pendingAttachment ? 0.45 : 1,
              },
            ]}
            hitSlop={6}
            accessibilityLabel={isRTL ? "رسالة صوتية" : "Voice message"}
          >
            <Mic size={18} color={recording ? "#fff" : colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {recording ? (
        <Text style={{ textAlign: "center", color: "#ef4444", paddingBottom: 8, fontSize: 12 }}>
          {isRTL ? "جاري التسجيل… اضغط الميكروفون للإرسال" : "Recording… tap mic to send"}
        </Text>
      ) : uploading ? (
        <Text
          style={{
            textAlign: "center",
            color: colors.mutedForeground,
            paddingBottom: 8,
            fontSize: 12,
          }}
        >
          {isRTL ? "جاري رفع الملف…" : "Uploading attachment…"}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexShrink: 0,
  },
  editBar: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  composer: {
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerActions: {
    alignItems: "center",
    gap: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    fontSize: 14,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
});
