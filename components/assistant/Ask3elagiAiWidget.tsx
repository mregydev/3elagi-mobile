import { usePathname, useSegments } from "expo-router";
import { Bot, Minus, Plus, Send, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppTextInput } from "@/components/AppTextInput";
import { AssistantMessageBubble } from "@/components/assistant/AssistantMessageBubble";
import { useAsk3elagiAiWidgetStore } from "@/domains/ai/widget-store";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { flexRow } from "@/utils/rtl";

/** FAB size — used by pages that need bottom padding clearance. */
export const ASK_3ELAGI_AI_FAB_SIZE = 56;
/** Distinct red so the floating Ask 3elagi AI control stands out from primary CTAs. */
const ASK_3ELAGI_AI_FAB_RED = "#e11d48";
const ASK_3ELAGI_AI_FAB_RED_SHADOW =
  "0 10px 28px rgba(225, 29, 72, 0.45), 0 4px 12px rgba(15, 23, 42, 0.18)";

function shouldHideOnRoute(pathname: string | null, segments: string[]): boolean {
  const root = segments[0];
  if (!root || root === "welcome" || root === "auth") return true;
  if (root === "admin") return true;
  if (root === "video-call") return true;
  if (root === "doctor-pending") return true;
  if (pathname?.includes("/assistant") || segments.includes("assistant")) {
    return true;
  }
  return false;
}

/** Doctor patient profile route → scope AI to that patient. */
function patientUserIdFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = pathname.match(/\/patients\/([0-9a-fA-F-]{36})(?:\/|$)/);
  return match?.[1] ?? null;
}

function Ask3elagiAiPanel() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isDesktop } = useWebLayout();
  const closeWidget = useAsk3elagiAiWidgetStore((s) => s.closeWidget);
  const consumePendingQuestion = useAsk3elagiAiWidgetStore(
    (s) => s.consumePendingQuestion,
  );
  const scopedPatientUserId = useAsk3elagiAiWidgetStore((s) => s.patientUserId);
  const setPatientUserId = useAsk3elagiAiWidgetStore((s) => s.setPatientUserId);
  const assistant = useAiAssistant();
  const listRef = useRef<FlatList>(null);
  const [text, setText] = useState("");
  const messages = assistant.activeConversation?.messages ?? [];
  const sentPendingRef = useRef(false);
  const patientUserId =
    scopedPatientUserId ?? patientUserIdFromPath(pathname);

  useEffect(() => {
    const fromPath = patientUserIdFromPath(pathname);
    if (fromPath) setPatientUserId(fromPath);
  }, [pathname, setPatientUserId]);

  const scrollToLatest = useCallback((animated = false) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  useEffect(() => {
    if (sentPendingRef.current) return;
    const pending = consumePendingQuestion();
    if (!pending?.trim()) return;
    sentPendingRef.current = true;
    void assistant.sendMessage(
      pending.trim(),
      patientUserId ?? undefined,
    );
  }, [consumePendingQuestion, assistant, patientUserId]);

  // Scroll to last message when the panel opens / history finishes loading.
  useEffect(() => {
    if (assistant.loadingHistory) return;
    scrollToLatest(false);
    const t1 = setTimeout(() => scrollToLatest(false), 80);
    const t2 = setTimeout(() => scrollToLatest(false), 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [
    assistant.loadingHistory,
    assistant.activeId,
    messages.length,
    scrollToLatest,
  ]);

  useEffect(() => {
    if (messages.length === 0) return;
    scrollToLatest(true);
  }, [messages.length, assistant.streaming, scrollToLatest]);

  const submit = () => {
    const value = text.trim();
    if (!value || assistant.sending || assistant.streaming) return;
    setText("");
    void assistant.sendMessage(value, patientUserId ?? undefined);
  };

  const onNewChat = () => {
    setText("");
    sentPendingRef.current = true; // don't auto-resend pending
    assistant.startNewChat();
  };

  const panelStyle = isDesktop
    ? {
        top: undefined as number | undefined,
        bottom: Math.max(insets.bottom, 12) + 8,
        ...(isRTL
          ? { left: 16, right: undefined as number | undefined }
          : { right: 16, left: undefined as number | undefined }),
        width: windowWidth * 0.3,
        maxWidth: windowWidth * 0.3,
        height: Math.min(windowHeight * 0.75, 640),
        borderRadius: 18,
      }
    : {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: windowWidth,
        maxWidth: windowWidth,
        height: windowHeight,
        borderRadius: 0,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      };

  const webShadow =
    Platform.OS === "web"
      ? ({
          boxShadow: isDesktop
            ? "0 16px 48px rgba(15, 23, 42, 0.22), 0 4px 14px rgba(15, 23, 42, 0.12)"
            : "0 8px 28px rgba(15, 23, 42, 0.18)",
        } as const)
      : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.panel, panelStyle, webShadow]}
    >
      <View
        style={[
          styles.panelInner,
          {
            backgroundColor: colors.card,
            borderColor: colors.primary,
            borderWidth: isDesktop ? 2 : 0,
            borderRadius: panelStyle.borderRadius,
          },
        ]}
      >
      <View
        style={[
          styles.panelHeader,
          {
            flexDirection: dir,
            borderBottomColor: colors.border,
            backgroundColor: colors.secondary,
          },
        ]}
      >
        <View style={[styles.headerLeft, { flexDirection: dir, flex: 1 }]}>
          <View
            style={[styles.iconBubble, { backgroundColor: `${colors.primary}14` }]}
          >
            <Bot size={16} color={colors.primary} />
          </View>
          <Text
            style={[styles.title, { color: colors.foreground, flexShrink: 1 }]}
            numberOfLines={1}
          >
            {t.records.ask3elagiAi}
          </Text>
        </View>
        <View style={[styles.headerActions, { flexDirection: dir }]}>
          <Pressable
            onPress={onNewChat}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t.records.ask3elagiAiNewChat}
            style={[
              styles.newChatBtn,
              { backgroundColor: `${colors.primary}14`, flexDirection: dir },
            ]}
          >
            <Plus size={14} color={colors.primary} />
            <Text style={[styles.newChatLabel, { color: colors.primary }]}>
              {t.records.ask3elagiAiNewChat}
            </Text>
          </Pressable>
          {isDesktop ? (
            <Pressable
              onPress={closeWidget}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Minimize"
              style={styles.iconBtn}
            >
              <Minus size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={closeWidget}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.iconBtn}
          >
            <X size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {assistant.loadingHistory ? (
        <View style={[styles.chatLoading, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          key={assistant.activeId ?? "new"}
          keyExtractor={(item) => item.id}
          style={[styles.chatList, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.chatListContent}
          onContentSizeChange={() => scrollToLatest(false)}
          onLayout={() => scrollToLatest(false)}
          renderItem={({ item }) => (
            <AssistantMessageBubble
              message={item}
              compact
              selfUserId={assistant.selfUserId}
              isRTL={isRTL}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              {t.records.ask3elagiAiPlaceholder}
            </Text>
          }
        />
      )}

      <View
        style={[
          styles.composer,
          {
            flexDirection: dir,
            borderTopColor: colors.border,
            backgroundColor: colors.secondary,
          },
        ]}
      >
        <AppTextInput
          value={text}
          onChangeText={setText}
          placeholder={t.records.ask3elagiAiPlaceholder}
          style={[
            styles.input,
            {
              color: colors.foreground,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
          editable={!assistant.sending && !assistant.streaming}
          onSubmitEditing={submit}
          returnKeyType="send"
        />
        <Pressable
          onPress={submit}
          disabled={assistant.sending || assistant.streaming || !text.trim()}
          style={[
            styles.sendBtn,
            {
              backgroundColor: colors.primary,
              opacity:
                assistant.sending || assistant.streaming || !text.trim()
                  ? 0.5
                  : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t.records.ask3elagiAi}
        >
          {assistant.sending || assistant.streaming ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Send size={16} color="#fff" />
          )}
        </Pressable>
      </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Global floating Ask 3elagi AI chat — mount once in the root layout. */
export function Ask3elagiAiWidget() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const segments = useSegments();
  const hydrated = useAuthStore((s) => s.hydrated);
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const open = useAsk3elagiAiWidgetStore((s) => s.open);
  const openWidget = useAsk3elagiAiWidgetStore((s) => s.openWidget);
  const closeWidget = useAsk3elagiAiWidgetStore((s) => s.closeWidget);

  const signedIn = isSignedIn(profile, accessToken);
  const roleOk =
    role?.toLowerCase() === "patient" || role?.toLowerCase() === "doctor";
  const hidden = shouldHideOnRoute(pathname, segments as string[]);

  useEffect(() => {
    if (!signedIn || !roleOk || hidden) closeWidget();
  }, [signedIn, roleOk, hidden, closeWidget]);

  if (!hydrated || !signedIn || !roleOk || hidden) return null;

  const side = isRTL ? { left: 16 } : { right: 16 };

  return (
    <View style={styles.host} pointerEvents="box-none">
      {open ? <Ask3elagiAiPanel /> : null}

      {!open ? (
        <Pressable
          onPress={() => openWidget(undefined, patientUserIdFromPath(pathname))}
          style={[
            styles.fab,
            side,
            {
              bottom: Math.max(insets.bottom, 12) + 16,
              backgroundColor: ASK_3ELAGI_AI_FAB_RED,
              shadowColor: ASK_3ELAGI_AI_FAB_RED,
            },
            Platform.OS === "web"
              ? ({ boxShadow: ASK_3ELAGI_AI_FAB_RED_SHADOW } as const)
              : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t.records.ask3elagiAi}
        >
          <Bot size={22} color="#fff" />
          <Text style={styles.fabLabel} numberOfLines={1}>
            {t.records.ask3elagiAi}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    elevation: 200,
  },
  fab: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: ASK_3ELAGI_AI_FAB_SIZE,
    paddingHorizontal: 16,
    borderRadius: 28,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  fabLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    maxWidth: 140,
  },
  panel: {
    position: "absolute",
    // Shadow lives on the outer shell; inner clips rounded corners.
    overflow: "visible",
    shadowColor: "#0f172a",
    shadowOpacity: 0.32,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 14 },
    elevation: 28,
  },
  panelInner: {
    flex: 1,
    overflow: "hidden",
  },
  panelHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  headerLeft: { alignItems: "center", gap: 8, minWidth: 0 },
  headerActions: { alignItems: "center", gap: 4, flexShrink: 0 },
  iconBtn: { padding: 4 },
  newChatBtn: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  newChatLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "800" },
  chatList: { flex: 1 },
  chatListContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexGrow: 1,
  },
  chatLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyHint: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  composer: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
