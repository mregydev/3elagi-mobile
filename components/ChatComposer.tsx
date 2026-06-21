import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { ClipboardList, Mic, Paperclip, Send, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { uploadFile } from "@/domains/medical/api";
import type { ChatMessage, SendMessageInput } from "@/domains/chat/types";
import {
  emitChatStopTyping,
  emitChatTyping,
} from "@/domains/presence/socket";
import { useColors } from "@/hooks/useColors";
import { handleEnterToSendMessage } from "@/utils/enterToSendMessage";
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

function mimeFromUri(uri: string, fallback: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "m4a") return "audio/m4a";
  if (ext === "mp4") return "audio/mp4";
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
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const rowDir = chatFlexRow();

  useEffect(() => {
    return () => {
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      if (isTypingRef.current) {
        emitChatStopTyping(peerId, selfId);
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

  const createPending = (
    type: ChatMessage["type"],
    localAttachmentUrl?: string,
  ): string => {
    const tempId = `pending-${Date.now()}`;
    onAddPending({
      id: tempId,
      conversationId: peerId,
      senderId: "me",
      text: type === "image" ? "Photo" : type === "voice" ? "Voice message" : "",
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
    label?: string,
  ) => {
    const tempId = type === "image" || type === "voice"
      ? createPending(type, type === "image" ? uri : undefined)
      : undefined;

    setUploading(true);
    try {
      const uploaded = await uploadFile(uri, mimeType, fileName, accessToken);
      await onSend(
        {
          recipientId: peerId,
          type,
          content: label,
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

  const pickGallery = async (media: "image" | "video") => {
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
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadAndSend(
      asset.uri,
      asset.mimeType ?? (media === "image" ? "image/jpeg" : "video/mp4"),
      asset.fileName ?? `${media}-${Date.now()}`,
      media,
    );
  };

  const pickCamera = async (media: "image" | "video") => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        isRTL ? "إذن مطلوب" : "Permission required",
        isRTL ? "يرجى السماح بالوصول إلى الكاميرا" : "Please allow camera access.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: media === "image" ? ["images"] : ["videos"],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadAndSend(
      asset.uri,
      asset.mimeType ?? (media === "image" ? "image/jpeg" : "video/mp4"),
      asset.fileName ?? `camera-${Date.now()}`,
      media,
    );
  };

  const showAttachMenu = () => {
    const options = [
      isRTL ? "صورة من المعرض" : "Photo from gallery",
      isRTL ? "فيديو من المعرض" : "Video from gallery",
      isRTL ? "التقاط صورة" : "Take photo",
      isRTL ? "تسجيل فيديو" : "Record video",
      isRTL ? "إلغاء" : "Cancel",
    ];
    const cancelIndex = options.length - 1;

    const handle = (index: number) => {
      if (index === 0) void pickGallery("image");
      else if (index === 1) void pickGallery("video");
      else if (index === 2) void pickCamera("image");
      else if (index === 3) void pickCamera("video");
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        (index) => {
          if (index !== undefined && index !== cancelIndex) handle(index);
        },
      );
    } else {
      Alert.alert(isRTL ? "إرفاق" : "Attach", undefined, [
        { text: options[0], onPress: () => handle(0) },
        { text: options[1], onPress: () => handle(1) },
        { text: options[2], onPress: () => handle(2) },
        { text: options[3], onPress: () => handle(3) },
        { text: options[cancelIndex], style: "cancel" },
      ]);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      try {
        const startedAt = recordingStartedAt ?? Date.now();
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        setRecordingStartedAt(null);

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

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

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

    await onSend({ recipientId: peerId, type: "text", content: t });
    setText("");
  };

  const busy = sending || uploading || disabled;
  const isEditing = !!editingMessage;

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
        <Pressable
          onPress={showAttachMenu}
          disabled={busy || !!recording || isEditing}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: pressed ? colors.border : colors.muted, opacity: busy || recording || isEditing ? 0.5 : 1 },
          ]}
          hitSlop={6}
        >
          <Paperclip size={18} color={colors.mutedForeground} />
        </Pressable>

        {isPatient ? (
          <Pressable
            onPress={onPickMedical}
            disabled={busy || !!recording || isEditing}
            accessibilityLabel={isRTL ? "مشاركة سجل طبي" : "Share medical record"}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: pressed ? colors.primary : `${colors.primary}18`,
                opacity: busy || recording || isEditing ? 0.5 : 1,
              },
            ]}
            hitSlop={6}
          >
            <ClipboardList size={18} color={colors.primary} />
          </Pressable>
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
          placeholder={isRTL ? "اكتب رسالة…" : "Type a message…"}
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
          editable={!busy && !recording}
          blurOnSubmit={false}
          onKeyPress={(e) => handleEnterToSendMessage(e, sendText)}
        />

        {text.trim() ? (
          <Pressable
            onPress={sendText}
            disabled={busy}
            style={[styles.iconBtn, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}
          >
            <Send size={18} color="#fff" />
          </Pressable>
        ) : isEditing ? null : (
          <Pressable
            onPress={toggleRecording}
            disabled={busy && !recording}
            style={[
              styles.iconBtn,
              {
                backgroundColor: recording ? "#ef4444" : colors.muted,
                opacity: busy && !recording ? 0.5 : 1,
              },
            ]}
            hitSlop={6}
          >
            <Mic size={18} color={recording ? "#fff" : colors.mutedForeground} />
          </Pressable>
        )}
      </View>
      {recording ? (
        <Text style={{ textAlign: "center", color: "#ef4444", paddingBottom: 8, fontSize: 12 }}>
          {isRTL ? "جاري التسجيل… اضغط الميكروفون للإرسال" : "Recording… tap mic to send"}
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
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
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
