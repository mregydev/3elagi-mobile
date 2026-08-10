import { usePathname, useSegments } from "expo-router";
import { Bot, Minus, Plus, Send, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  KeyboardAvoidingView,
  KeyboardStickyView,
  useKeyboardState,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppTextInput } from "@/components/AppTextInput";
import { AssistantMessageBubble } from "@/components/assistant/AssistantMessageBubble";
import { GuestAiLimitError, sendGuestAiChat } from "@/domains/ai/guestApi";
import {
  GUEST_AI_MAX_MESSAGES,
  getGuestAiSentCount,
  getGuestAiSessionId,
  setGuestAiSentCount,
} from "@/domains/ai/guestSession";
import type { AiMessage } from "@/domains/ai/types";
import { useAsk3elagiAiWidgetStore } from "@/domains/ai/widget-store";
import { promptAuthForConsultation } from "@/domains/auth/guestBrowse";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { getApiLang } from "@/domains/i18n/store";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { flexRow } from "@/utils/rtl";
import { MEDICAL_RECORD_ADD_BAR_HEIGHT } from "@/components/records/MedicalRecordAddBar";
import { MEDICAL_FORM_SAVE_BAR_HEIGHT } from "@/constants/medicalFormFooter";
import { profileSaveChromeHeight } from "@/components/profile/profileSaveChrome";
import { viewportPortal } from "@/utils/viewportPortal";

function makeLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** FAB size — used by pages that need bottom padding clearance. */
export const ASK_3ELAGI_AI_FAB_SIZE = 56;
/** Gap from the viewport edge. */
export const ASK_3ELAGI_AI_FAB_CHROME_GAP = 8;

function isProfileRoute(pathname: string | null, segments: string[]): boolean {
  return segments.includes("profile") || Boolean(pathname?.includes("/profile"));
}

/** Records pages dock an add-record bar — lift the FAB above it on mobile. */
function recordsAddBarFabOffset(
  pathname: string | null,
  segments: string[],
  isDesktop: boolean,
): number {
  if (isDesktop) return 0;
  const onRecordsTab =
    segments.includes("records") || Boolean(pathname?.includes("/records"));
  const onPatientRecords = Boolean(pathname?.match(/\/patients\/[^/]+\/?$/));
  const onBodyPartRecords = Boolean(pathname?.includes("/medical/body"));
  if (!onRecordsTab && !onPatientRecords && !onBodyPartRecords) return 0;
  return MEDICAL_RECORD_ADD_BAR_HEIGHT + ASK_3ELAGI_AI_FAB_CHROME_GAP;
}

/** The medical add / prescription forms dock a Save + Cancel bar — clear it. */
function medicalFormSaveBarFabOffset(pathname: string | null): number {
  if (!pathname) return 0;
  if (!/\/medical\/(add|prescription\/add)/.test(pathname)) return 0;
  return MEDICAL_FORM_SAVE_BAR_HEIGHT + ASK_3ELAGI_AI_FAB_CHROME_GAP;
}

/** Profile pages dock a Save bar — lift the FAB above it. */
function profileSaveBarFabOffset(
  pathname: string | null,
  segments: string[],
  isDesktop: boolean,
): number {
  if (!isProfileRoute(pathname, segments)) return 0;
  return (
    profileSaveChromeHeight({ withLogout: !isDesktop }) +
    ASK_3ELAGI_AI_FAB_CHROME_GAP
  );
}

/** Chat screens dock a composer (mic + input) — floating FAB is hidden;
 * ChatComposer renders an inline Ask AI control above the input instead. */
function hideFabOnChatRoute(
  pathname: string | null,
  segments: string[],
): boolean {
  if (pathname && /(^|\/)chat(\/|$)/.test(pathname)) return true;
  return segments.some((s) => s === "chat");
}
/** Distinct red so the floating Ask 3elagi AI control stands out from primary CTAs. */
const ASK_3ELAGI_AI_FAB_RED = "#e11d48";
const ASK_3ELAGI_AI_FAB_RED_SOFT = "rgba(255, 255, 255, 0.18)";
const ASK_3ELAGI_AI_FAB_ON_RED = "#ffffff";
const ASK_3ELAGI_AI_FAB_ON_RED_MUTED = "rgba(255, 255, 255, 0.82)";
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
  const keyboardVisible = useKeyboardState((s) => s.isVisible);
  const pathname = usePathname();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isDesktop } = useWebLayout();
  const isNative = Platform.OS !== "web";
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const signedIn = isSignedIn(profile, accessToken);
  const closeWidget = useAsk3elagiAiWidgetStore((s) => s.closeWidget);
  const consumePendingQuestion = useAsk3elagiAiWidgetStore(
    (s) => s.consumePendingQuestion,
  );
  const scopedPatientUserId = useAsk3elagiAiWidgetStore((s) => s.patientUserId);
  const setPatientUserId = useAsk3elagiAiWidgetStore((s) => s.setPatientUserId);
  const assistant = useAiAssistant();
  const listRef = useRef<FlatList>(null);
  const [text, setText] = useState("");
  const [guestMessages, setGuestMessages] = useState<AiMessage[]>([]);
  const [guestSending, setGuestSending] = useState(false);
  const [guestSentCount, setGuestSentCountState] = useState(0);
  const sentPendingRef = useRef(false);
  const patientUserId =
    scopedPatientUserId ?? patientUserIdFromPath(pathname);

  const messages = signedIn
    ? (assistant.activeConversation?.messages ?? [])
    : guestMessages;
  const busy = signedIn
    ? assistant.sending || assistant.streaming
    : guestSending;
  const loadingHistory = signedIn ? assistant.loadingHistory : false;

  useEffect(() => {
    const fromPath = patientUserIdFromPath(pathname);
    if (fromPath) setPatientUserId(fromPath);
  }, [pathname, setPatientUserId]);

  useEffect(() => {
    if (signedIn) return;
    void getGuestAiSentCount().then(setGuestSentCountState);
  }, [signedIn]);

  const scrollToLatest = useCallback((animated = false) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const sendGuestMessage = useCallback(
    async (value: string) => {
      const question = value.trim();
      if (!question || guestSending) return;

      const alreadySent = await getGuestAiSentCount();
      if (alreadySent >= GUEST_AI_MAX_MESSAGES) {
        promptAuthForConsultation();
        return;
      }

      const userMsg: AiMessage = {
        id: makeLocalId("guest-user"),
        role: "user",
        content: question,
        createdAt: new Date().toISOString(),
      };
      const assistantLocalId = makeLocalId("guest-ai");
      const pendingAssistant: AiMessage = {
        id: assistantLocalId,
        role: "assistant",
        content: "",
        pending: true,
        createdAt: new Date().toISOString(),
      };

      setGuestSending(true);
      setGuestMessages((prev) => [...prev, userMsg, pendingAssistant]);

      try {
        const guestId = await getGuestAiSessionId();
        const history = guestMessages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .filter((m) => !m.pending && m.content.trim())
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));
        const result = await sendGuestAiChat({
          guestId,
          message: question,
          history,
          locale: getApiLang(),
        });
        await setGuestAiSentCount(result.used);
        setGuestSentCountState(result.used);
        setGuestMessages((prev) =>
          prev.map((m) =>
            m.id === assistantLocalId
              ? { ...m, pending: false, content: result.content }
              : m,
          ),
        );
      } catch (e) {
        if (e instanceof GuestAiLimitError) {
          setGuestMessages((prev) =>
            prev.filter((m) => m.id !== userMsg.id && m.id !== assistantLocalId),
          );
          promptAuthForConsultation();
          return;
        }
        const errText =
          e instanceof Error ? e.message : t.auth.genericError;
        setGuestMessages((prev) =>
          prev.map((m) =>
            m.id === assistantLocalId
              ? { ...m, pending: false, content: errText }
              : m,
          ),
        );
      } finally {
        setGuestSending(false);
      }
    },
    [guestMessages, guestSending, t.auth.genericError],
  );

  useEffect(() => {
    if (sentPendingRef.current) return;
    const pending = consumePendingQuestion();
    if (!pending?.trim()) return;
    sentPendingRef.current = true;
    if (signedIn) {
      void assistant.sendMessage(pending.trim(), patientUserId ?? undefined);
    } else {
      void sendGuestMessage(pending.trim());
    }
  }, [
    consumePendingQuestion,
    assistant,
    patientUserId,
    signedIn,
    sendGuestMessage,
  ]);

  // Scroll to last message when the panel opens / history finishes loading.
  useEffect(() => {
    if (loadingHistory) return;
    scrollToLatest(false);
    const t1 = setTimeout(() => scrollToLatest(false), 80);
    const t2 = setTimeout(() => scrollToLatest(false), 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [
    loadingHistory,
    assistant.activeId,
    messages.length,
    scrollToLatest,
  ]);

  useEffect(() => {
    if (messages.length === 0) return;
    scrollToLatest(true);
  }, [messages.length, assistant.streaming, guestSending, scrollToLatest]);

  const submit = () => {
    const value = text.trim();
    if (!value || busy) return;
    setText("");
    if (signedIn) {
      void assistant.sendMessage(value, patientUserId ?? undefined);
      return;
    }
    void sendGuestMessage(value);
  };

  const onNewChat = () => {
    setText("");
    sentPendingRef.current = true; // don't auto-resend pending
    if (signedIn) {
      assistant.startNewChat();
      return;
    }
    setGuestMessages([]);
  };

  const panelStyle = isDesktop
    ? {
        top: undefined as number | undefined,
        bottom: Math.max(insets.bottom, 12) + ASK_3ELAGI_AI_FAB_CHROME_GAP,
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
        // Safe area when keyboard closed; sticky composer sits on keyboard when open.
        paddingBottom:
          isNative && keyboardVisible ? 0 : Math.max(insets.bottom, 8),
      };

  const webShadow =
    Platform.OS === "web"
      ? ({
          boxShadow: isDesktop
            ? "0 16px 48px rgba(15, 23, 42, 0.22), 0 4px 14px rgba(15, 23, 42, 0.12)"
            : "0 8px 28px rgba(15, 23, 42, 0.18)",
        } as const)
      : null;

  const PanelShell = isNative ? View : KeyboardAvoidingView;
  const panelShellProps = isNative
    ? {}
    : ({ behavior: "padding" as const });

  return (
    <PanelShell
      {...panelShellProps}
      style={
        [
          styles.panel,
          panelStyle,
          webShadow,
          Platform.OS === "web" ? ({ position: "fixed" } as const) : null,
        ] as object
      }
    >
      <View
        style={[
          styles.panelInner,
          {
            backgroundColor: colors.card,
            borderColor: ASK_3ELAGI_AI_FAB_RED,
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
            borderBottomColor: "rgba(255, 255, 255, 0.22)",
            backgroundColor: ASK_3ELAGI_AI_FAB_RED,
          },
        ]}
      >
        <View style={[styles.headerLeft, { flexDirection: dir, flex: 1 }]}>
          <View
            style={[styles.iconBubble, { backgroundColor: ASK_3ELAGI_AI_FAB_RED_SOFT }]}
          >
            <Bot size={16} color={ASK_3ELAGI_AI_FAB_ON_RED} />
          </View>
          <Text
            style={[styles.title, { color: ASK_3ELAGI_AI_FAB_ON_RED, flexShrink: 1 }]}
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
              { backgroundColor: ASK_3ELAGI_AI_FAB_RED_SOFT, flexDirection: dir },
            ]}
          >
            <Plus size={14} color={ASK_3ELAGI_AI_FAB_ON_RED} />
            <Text style={[styles.newChatLabel, { color: ASK_3ELAGI_AI_FAB_ON_RED }]}>
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
              <Minus size={18} color={ASK_3ELAGI_AI_FAB_ON_RED_MUTED} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={closeWidget}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.iconBtn}
          >
            <X size={18} color={ASK_3ELAGI_AI_FAB_ON_RED_MUTED} />
          </Pressable>
        </View>
      </View>

      {loadingHistory ? (
        <View style={[styles.chatLoading, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          key={signedIn ? (assistant.activeId ?? "new") : "guest"}
          keyExtractor={(item) => item.id}
          style={[styles.chatList, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.chatListContent}
          onContentSizeChange={() => scrollToLatest(false)}
          onLayout={() => scrollToLatest(false)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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

      {!signedIn ? (
        <Text
          style={[
            styles.guestQuota,
            { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {`${Math.max(0, GUEST_AI_MAX_MESSAGES - guestSentCount)} / ${GUEST_AI_MAX_MESSAGES}`}
        </Text>
      ) : null}

      <KeyboardStickyView enabled={isNative} offset={{ closed: 0, opened: 0 }}>
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
            editable={!busy}
            onSubmitEditing={submit}
            returnKeyType="send"
          />
          <Pressable
            onPress={submit}
            disabled={busy || !text.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor: colors.primary,
                opacity: busy || !text.trim() ? 0.5 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.records.ask3elagiAi}
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Send size={16} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardStickyView>
      </View>
    </PanelShell>
  );
}

/** Global floating Ask 3elagi AI chat — mount once in the root layout. */
export function Ask3elagiAiWidget() {
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useWebLayout();
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
  /** Guests + patient/doctor accounts; hide for admin / unsupported roles when signed in. */
  const canUseWidget = !signedIn || roleOk;
  const hidden = shouldHideOnRoute(pathname, segments as string[]);
  // Circle icon-only on native + mobile web; labeled pill on desktop web.
  const iconOnlyFab = Platform.OS !== "web" || !isDesktop;

  useEffect(() => {
    if (!canUseWidget || hidden) closeWidget();
  }, [canUseWidget, hidden, closeWidget]);

  // Escape key closes the floating AI chat (web / mobile browser).
  useEffect(() => {
    if (Platform.OS !== "web" || !open || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeWidget();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeWidget]);

  if (!hydrated || !canUseWidget || hidden) return null;

  const edge = 16;
  const addBarLift = recordsAddBarFabOffset(
    pathname,
    segments as string[],
    isDesktop,
  );
  const profileLift = profileSaveBarFabOffset(
    pathname,
    segments as string[],
    isDesktop,
  );
  const hideFab = hideFabOnChatRoute(pathname, segments as string[]);
  const medicalFormLift = medicalFormSaveBarFabOffset(pathname);
  const bottom =
    Math.max(insets.bottom, ASK_3ELAGI_AI_FAB_CHROME_GAP) +
    addBarLift +
    profileLift +
    medicalFormLift;
  // Bottom-right in English (LTR), bottom-left in Arabic (RTL).
  const sideStyle = isRTL
    ? { left: edge, right: undefined as number | undefined }
    : { right: edge, left: undefined as number | undefined };

  const content = (
    <View style={styles.host} pointerEvents="box-none">
      {open ? <Ask3elagiAiPanel /> : null}

      {!open && !hideFab ? (
        <Pressable
          onPress={() => openWidget(undefined, patientUserIdFromPath(pathname))}
          style={[
            iconOnlyFab ? styles.fabCircle : styles.fab,
            sideStyle,
            {
              bottom,
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
          {iconOnlyFab ? (
            <Bot size={26} color="#fff" />
          ) : (
            <>
              <Bot size={22} color="#fff" />
              <Text style={styles.fabLabel} numberOfLines={1}>
                {t.records.ask3elagiAi}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );

  return viewportPortal(content);
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    elevation: 10000,
    ...(Platform.OS === "web"
      ? ({
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          pointerEvents: "box-none",
        } as const)
      : null),
  },
  fab: {
    position: Platform.OS === "web" ? ("fixed" as const) : "absolute",
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
    zIndex: 10001,
  },
  fabCircle: {
    position: Platform.OS === "web" ? ("fixed" as const) : "absolute",
    width: ASK_3ELAGI_AI_FAB_SIZE,
    height: ASK_3ELAGI_AI_FAB_SIZE,
    borderRadius: ASK_3ELAGI_AI_FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
    zIndex: 10001,
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
  guestQuota: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingTop: 6,
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
