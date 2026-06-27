import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { AssistantLoadingIndicator } from "@/components/assistant/AssistantLoadingIndicator";
import { AssistantMessageActions } from "@/components/assistant/AssistantMessageActions";
import type { AiMessage } from "@/domains/ai/types";
import type { AiFeedbackType } from "@/domains/emotions/types";
import { useColors } from "@/hooks/useColors";

interface Props {
  message: AiMessage;
  compact?: boolean;
  selfUserId?: string | null;
  onFeedback?: (emotion: AiFeedbackType) => void;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function handleAssistantLink(url: string): boolean {
  if (url.startsWith("/medical/")) {
    const id = url.replace("/medical/", "").split("?")[0];
    if (id) {
      router.push({ pathname: "/medical/[id]", params: { id } });
      return false;
    }
  }
  if (url.startsWith("/doctor/")) {
    const doctorId = url.replace("/doctor/", "").split("?")[0];
    if (doctorId) {
      router.push({ pathname: "/doctor/[doctorId]", params: { doctorId } });
      return false;
    }
  }
  return true;
}

function canReactToAiMessage(message: AiMessage): boolean {
  return (
    message.role === "assistant" &&
    !message.pending &&
    !message.id.startsWith("draft-") &&
    !message.id.startsWith("local-")
  );
}

function AssistantMessageBubbleBase({
  message,
  compact = false,
  selfUserId,
  onFeedback,
}: Props) {
  const colors = useColors();
  const isUser = message.role === "user";
  const isLoading = message.pending && !message.content?.trim();
  const showActions = canReactToAiMessage(message);
  const myFeedback = message.emotions?.find((row) => row.userId === selfUserId)
    ?.emotion as AiFeedbackType | undefined;

  if (isLoading) {
    return (
      <View style={[compact ? styles.rowCompact : styles.row, styles.rowAssistant]}>
        <AssistantLoadingIndicator compact />
      </View>
    );
  }

  return (
    <View
      style={[
        compact ? styles.rowCompact : styles.row,
        isUser ? styles.rowUser : styles.rowAssistant,
      ]}
    >
      <View
        style={[
          styles.bubbleWrap,
          isUser ? styles.bubbleWrapUser : styles.bubbleWrapAssistant,
          { maxWidth: compact ? "90%" : "88%" },
        ]}
      >
        <View
          style={[
            compact ? styles.bubbleCompact : styles.bubble,
            {
              backgroundColor: isUser ? colors.primary : colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {isUser ? (
            <Text style={[styles.text, { color: colors.primaryForeground }]}>
              {message.content}
            </Text>
          ) : (
            <Markdown
              onLinkPress={handleAssistantLink}
              style={{
                body: { color: colors.foreground, fontSize: 15, lineHeight: 22 },
                paragraph: { marginTop: 0, marginBottom: 8 },
                bullet_list: { marginBottom: 8 },
                ordered_list: { marginBottom: 8 },
                link: { color: colors.primary, textDecorationLine: "underline" },
              }}
            >
              {message.content || " "}
            </Markdown>
          )}
          <Text
            style={[
              styles.time,
              { color: isUser ? colors.primaryForeground : colors.mutedForeground },
            ]}
          >
            {formatTime(message.createdAt)}
          </Text>
        </View>

        {showActions ? (
          <AssistantMessageActions
            content={message.content}
            myFeedback={myFeedback}
            onFeedback={onFeedback}
            disabled={message.pending}
          />
        ) : null}
      </View>
    </View>
  );
}

// Memoized: during streaming only the last assistant message object changes
// (patchAssistantMessage keeps other message references stable), so this skips
// re-rendering every other bubble on each token. onFeedback identity is
// intentionally ignored — it closes over a stable store callback.
export const AssistantMessageBubble = React.memo(
  AssistantMessageBubbleBase,
  (prev, next) =>
    prev.message === next.message &&
    prev.compact === next.compact &&
    prev.selfUserId === next.selfUserId,
);

const styles = StyleSheet.create({
  row: { marginBottom: 12, paddingHorizontal: 16 },
  rowCompact: { marginBottom: 8, paddingHorizontal: 12 },
  rowUser: { alignItems: "flex-end" },
  rowAssistant: { alignItems: "flex-start" },
  bubbleWrap: {
    position: "relative",
  },
  bubbleWrapUser: {
    alignItems: "flex-end",
  },
  bubbleWrapAssistant: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "100%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bubbleCompact: {
    maxWidth: "100%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { fontSize: 15, lineHeight: 22 },
  time: { fontSize: 11, marginTop: 6, alignSelf: "flex-end" },
});
