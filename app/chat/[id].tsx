import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ArrowRight, Mic, Paperclip, Send } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { seedUsers } from "@/domains/chat/repository";
import { useChatStore } from "@/domains/chat/store";
import type { ChatMessage } from "@/domains/chat/types";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

export default function ChatScreen() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const messages = useChatStore((s) => s.messages[id] || []);
  const loadMessages = useChatStore((s) => s.loadMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const markRead = useChatStore((s) => s.markRead);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const peer = useMemo(() => seedUsers.find((u) => u.id === id), [id]);

  useEffect(() => {
    if (id) {
      loadMessages(id);
      markRead(id);
    }
  }, [id, loadMessages, markRead]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  const send = () => {
    const t = text.trim();
    if (!t || !id) return;
    sendMessage(id, t);
    setText("");
  };

  const handleAttach = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        isRTL ? "إذن مطلوب" : "Permission required",
        isRTL ? "يرجى السماح بالوصول إلى الصور" : "Please allow access to your photo library.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const name = result.assets[0].uri.split("/").pop() ?? "file";
      Alert.alert(isRTL ? "تم اختيار الملف" : "Attachment selected", name);
    }
  };

  const handleMic = () => {
    Alert.alert(
      isRTL ? "رسالة صوتية" : "Voice message",
      isRTL ? "ميزة التسجيل الصوتي قادمة قريباً" : "Voice recording coming soon.",
    );
  };

  if (!peer) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Conversation not found.</Text>
      </View>
    );
  }

  // In RTL: row goes right→left so flex-start = right edge, flex-end = left edge.
  // My messages use flex-end  → left in RTL, right in LTR.
  // Peer messages use flex-start → right in RTL, left in LTR.
  // Avatar placeholder is the first JSX child; in row-reverse it sits at the right.
  const rowDir: "row" | "row-reverse" = isRTL ? "row-reverse" : "row";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            flexDirection: rowDir,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          {isRTL
            ? <ArrowRight size={22} color={colors.foreground} />
            : <ArrowLeft size={22} color={colors.foreground} />}
        </Pressable>
        <Avatar uri={peer.avatarUrl} size={38} presence={peer.presence} />
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.peerName,
              { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {peer.name}
          </Text>
          <Text
            style={[
              styles.presence,
              { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {peer.presence === "online"
              ? isRTL ? "متاح الآن" : "Active now"
              : peer.presence === "away"
                ? isRTL ? "بعيد" : "Away"
                : isRTL ? "غير متصل" : "Offline"}
            {peer.specialty ? ` · ${peer.specialty}` : ""}
          </Text>
        </View>
      </View>

      {/* ── Message list ── */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 14, gap: 6 }}
        renderItem={({ item, index }) => {
          const mine = item.senderId === "me";
          const prev = messages[index - 1];
          const showAvatar = !mine && (!prev || prev.senderId !== item.senderId);

          return (
            <View
              style={[
                styles.bubbleRow,
                {
                  flexDirection: rowDir,
                  justifyContent: mine ? "flex-end" : "flex-start",
                },
              ]}
            >
              {/* Avatar placeholder — first JSX child sits at the outer edge in both row and row-reverse */}
              {!mine ? (
                <View style={{ width: 28 }}>
                  {showAvatar ? <Avatar uri={peer.avatarUrl} size={28} /> : null}
                </View>
              ) : null}

              <View
                style={[
                  styles.bubble,
                  mine
                    ? { backgroundColor: colors.primary }
                    : {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                ]}
              >
                <Text
                  style={{
                    color: mine ? "#fff" : colors.foreground,
                    fontSize: 14,
                    lineHeight: 20,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {item.text}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* ── Composer ── */}
      <View
        style={[
          styles.composer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 8,
            flexDirection: rowDir,
          },
        ]}
      >
        {/* Attach */}
        <Pressable
          onPress={handleAttach}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: pressed ? colors.border : colors.muted },
          ]}
          hitSlop={6}
        >
          <Paperclip size={18} color={colors.mutedForeground} />
        </Pressable>

        {/* Text input */}
        <TextInput
          value={text}
          onChangeText={setText}
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
          onSubmitEditing={send}
          blurOnSubmit
        />

        {/* Mic → Send toggle */}
        {text.trim() ? (
          <Pressable
            onPress={send}
            style={[styles.iconBtn, { backgroundColor: colors.primary }]}
          >
            <Send size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleMic}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: pressed ? colors.border : colors.muted },
            ]}
            hitSlop={6}
          >
            <Mic size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  peerName: { fontSize: 16, fontWeight: "700" },
  presence: { fontSize: 12, marginTop: 1 },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  composer: {
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
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
});
