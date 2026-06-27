import { Send } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  MOBILE_WEB_COMPOSER_FOOTER_GAP,
  mobileWebComposerStyles,
} from "@/constants/mobileWebComposer";
import { useColors } from "@/hooks/useColors";
import { handleEnterToSendMessage } from "@/utils/enterToSendMessage";

interface Props {
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
  bottomInset?: number;
  /** Tighter padding for mobile tab screens (no extra safe-area bottom). */
  compact?: boolean;
  onSend: (text: string) => void;
}

export function AssistantComposer({
  disabled,
  sending,
  placeholder = "Ask about your medical records…",
  bottomInset = 0,
  compact = false,
  onSend,
}: Props) {
  const colors = useColors();
  const [text, setText] = useState("");
  const isMobileWeb = Platform.OS === "web" && compact;
  const bottomPadding = isMobileWeb
    ? MOBILE_WEB_COMPOSER_FOOTER_GAP
    : (compact ? 6 : 12) + bottomInset;

  const submit = () => {
    const value = text.trim();
    if (!value || disabled || sending) return;
    onSend(value);
    setText("");
  };

  if (isMobileWeb) {
    return (
      <View
        style={[
          mobileWebComposerStyles.shell,
          {
            paddingBottom: bottomPadding,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={[mobileWebComposerStyles.row, { alignItems: "center" }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            multiline
            editable={!disabled && !sending}
            blurOnSubmit={false}
            onKeyPress={(e) => handleEnterToSendMessage(e, submit)}
            style={[
              mobileWebComposerStyles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.muted,
              },
            ]}
          />
          <Pressable
            onPress={submit}
            disabled={disabled || sending || !text.trim()}
            style={[
              mobileWebComposerStyles.iconBtn,
              {
                backgroundColor: colors.primary,
                opacity: disabled || sending || !text.trim() ? 0.45 : 1,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <Send color={colors.primaryForeground} size={18} />
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        compact ? styles.wrapCompact : styles.wrap,
        {
          borderTopColor: colors.border,
          backgroundColor: colors.card,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline
        editable={!disabled && !sending}
        blurOnSubmit={false}
        onKeyPress={(e) => handleEnterToSendMessage(e, submit)}
        style={[
          compact ? styles.inputCompact : styles.input,
          {
            color: colors.foreground,
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      />
      <Pressable
        onPress={submit}
        disabled={disabled || sending || !text.trim()}
        style={[
          compact ? styles.sendCompact : styles.send,
          {
            backgroundColor: colors.primary,
            opacity: disabled || sending || !text.trim() ? 0.5 : 1,
          },
        ]}
      >
        {sending ? (
          <ActivityIndicator color={colors.primaryForeground} size="small" />
        ) : (
          <Send color={colors.primaryForeground} size={18} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  wrapCompact: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputCompact: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
