import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { FileText } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import { SpokenHighlightText } from "@/components/assistant/SpokenHighlightText";
import { AssistantLoadingIndicator } from "@/components/assistant/AssistantLoadingIndicator";
import { AssistantMessageActions } from "@/components/assistant/AssistantMessageActions";
import type { AiMessage } from "@/domains/ai/types";
import type { AiFeedbackType } from "@/domains/emotions/types";
import { useColors } from "@/hooks/useColors";
import { handleAssistantLink } from "@/utils/assistantLinks";
import { prepareAssistantMarkdown } from "@/utils/assistantMarkdown";
import { stripMarkdownForTts } from "@/utils/stripMarkdownForTts";
import { splitSpokenWords } from "@/utils/spokenWords";

interface Props {
  message: AiMessage;
  compact?: boolean;
  selfUserId?: string | null;
  spokenWordIndex?: number | null;
  isReadingAloud?: boolean;
  onFeedback?: (emotion: AiFeedbackType) => void;
  onReadAloud?: () => void;
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
  spokenWordIndex = null,
  isReadingAloud = false,
  onFeedback,
  onReadAloud,
}: Props) {
  const colors = useColors();
  const isUser = message.role === "user";
  const isLoading = message.pending && !message.content?.trim();
  const showFeedback = canReactToAiMessage(message);
  const showAssistantActions =
    !isUser && !message.pending && !!message.content?.trim();
  const myFeedback = message.emotions?.find((row) => row.userId === selfUserId)
    ?.emotion as AiFeedbackType | undefined;
  const isSpeaking =
    spokenWordIndex != null && spokenWordIndex >= 0 && !isUser;
  const spokenWords = isSpeaking
    ? splitSpokenWords(stripMarkdownForTts(message.content || ""))
    : [];
  const imageSource = message.imageUri ?? message.imageUrl;

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
            <>
              {imageSource ? (
                <Image
                  source={{ uri: imageSource }}
                  style={styles.messageImage}
                  contentFit="cover"
                  transition={120}
                />
              ) : null}
              {!imageSource && message.fileName ? (
                <View style={styles.fileChip}>
                  <FileText color={colors.primaryForeground} size={18} />
                  <Text
                    style={{ color: colors.primaryForeground, fontSize: 13, flexShrink: 1 }}
                    numberOfLines={1}
                  >
                    {message.fileName}
                  </Text>
                </View>
              ) : null}
              {message.content?.trim() ? (
                <Text
                  style={[
                    styles.text,
                    {
                      color: colors.primaryForeground,
                      marginTop: imageSource ? 8 : 0,
                    },
                  ]}
                >
                  {message.content}
                </Text>
              ) : null}
            </>
          ) : isSpeaking ? (
            <SpokenHighlightText
              words={spokenWords}
              activeIndex={spokenWordIndex ?? 0}
              color={colors.foreground}
              highlightColor={colors.primary}
            />
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
              {prepareAssistantMarkdown(message.content || " ")}
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

        {showAssistantActions ? (
          <AssistantMessageActions
            content={message.content}
            myFeedback={myFeedback}
            onFeedback={showFeedback ? onFeedback : undefined}
            onReadAloud={onReadAloud}
            isReadingAloud={isReadingAloud}
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
    prev.selfUserId === next.selfUserId &&
    prev.spokenWordIndex === next.spokenWordIndex &&
    prev.isReadingAloud === next.isReadingAloud,
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
  messageImage: {
    width: 220,
    maxWidth: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  time: { fontSize: 11, marginTop: 6, alignSelf: "flex-end" },
});
