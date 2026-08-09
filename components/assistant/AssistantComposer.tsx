import { FileText, Mic, Paperclip, ScanLine, Send, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppTextInput } from "@/components/AppTextInput";
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
  compact?: boolean;
  onSend: (text: string) => void;
  /** Toggles speech-to-text into the input field. */
  onMicPress?: () => void;
  isDictating?: boolean;
  micLoading?: boolean;
  dictatedText?: string | null;
  onDictatedTextConsumed?: () => void;
  isRTL?: boolean;
  /** General AI attachment (image or PDF) sent to the model with the caption. */
  aiAttachment?: { previewUri?: string; name: string; isPdf: boolean } | null;
  onAttachAiFile?: () => void;
  /** Native only: attach via the document scanner. */
  onScanAiFile?: () => void;
  aiAttachLoading?: boolean;
  onRemoveAiAttachment?: () => void;
}
export function AssistantComposer({
  disabled,
  sending,
  placeholder = "Ask about your medical records…",
  bottomInset = 0,
  compact = false,
  onSend,
  onMicPress,
  isDictating = false,
  micLoading = false,
  dictatedText,
  onDictatedTextConsumed,
  isRTL = false,
  aiAttachment = null,
  onAttachAiFile,
  onScanAiFile,
  aiAttachLoading = false,
  onRemoveAiAttachment,
}: Props) {  const colors = useColors();
  const [text, setText] = useState("");
  const recordPulse = useRef(new Animated.Value(1)).current;
  const isMobileWeb = Platform.OS === "web" && compact;
  const bottomPadding = isMobileWeb
    ? MOBILE_WEB_COMPOSER_FOOTER_GAP + bottomInset
    : 8 + Math.max(bottomInset, 0);

  useEffect(() => {
    if (!dictatedText) return;
    setText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${dictatedText}` : dictatedText;
    });
    onDictatedTextConsumed?.();
  }, [dictatedText, onDictatedTextConsumed]);

  const submit = () => {
    const value = text.trim();
    if (disabled || sending) return;
    if (aiAttachment) {
      onSend(value);
      setText("");
      return;
    }
    if (!value) return;
    onSend(value);
    setText("");
  };

  const micBtnDisabled =
    disabled || (micLoading && !isDictating) || sending;

  const sendDisabled =
    disabled || sending || (!text.trim() && !aiAttachment);
  useEffect(() => {
    if (!isDictating) {
      recordPulse.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(recordPulse, {
          toValue: 0.55,
          duration: 520,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(recordPulse, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isDictating, recordPulse]);

  const micWebProps =
    Platform.OS === "web"
      ? ({
          className: ["assistant-mic-btn", isDictating ? "is-recording" : null]
            .filter(Boolean)
            .join(" "),
        } as { className?: string })
      : {};

  const iconBtnStyle = compact ? styles.iconCompact : styles.icon;
  const iconBtnMobile = isMobileWeb ? styles.iconMobileWeb : null;
  const glyphSize = 15;

  const micButton = onMicPress ? (
    <Animated.View style={{ opacity: isDictating ? recordPulse : 1 }}>
      <Pressable
        onPress={onMicPress}
        disabled={micBtnDisabled}
        accessibilityRole="button"
        accessibilityLabel={isDictating ? "Stop dictation" : "Dictate message"}
        {...micWebProps}
        style={[
          iconBtnStyle,
          iconBtnMobile,
          {
            backgroundColor: isDictating
              ? "#ef4444"
              : micLoading
                ? colors.primary
                : colors.muted,
            opacity: micBtnDisabled ? 0.45 : 1,
          },
        ]}
      >
        {micLoading ? (
          <ActivityIndicator color={colors.primaryForeground} size="small" />
        ) : (
          <Mic
            color={isDictating || micLoading ? "#fff" : colors.primary}
            size={glyphSize}
          />
        )}
      </Pressable>
    </Animated.View>
  ) : null;

  const aiAttachButton = onAttachAiFile ? (
    <Pressable
      onPress={onAttachAiFile}
      disabled={disabled || sending || aiAttachLoading}
      accessibilityRole="button"
      accessibilityLabel="Attach image or PDF"
      style={[
        iconBtnStyle,
        iconBtnMobile,
        {
          backgroundColor: colors.muted,
          opacity: disabled || sending || aiAttachLoading ? 0.45 : 1,
        },
      ]}
    >
      {aiAttachLoading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Paperclip color={colors.primary} size={glyphSize} />
      )}
    </Pressable>
  ) : null;

  const scanButton = onScanAiFile ? (
    <Pressable
      onPress={onScanAiFile}
      disabled={disabled || sending || aiAttachLoading}
      accessibilityRole="button"
      accessibilityLabel="Scan document"
      style={[
        iconBtnStyle,
        iconBtnMobile,
        {
          backgroundColor: colors.muted,
          opacity: disabled || sending || aiAttachLoading ? 0.45 : 1,
        },
      ]}
    >
      <ScanLine color={colors.primary} size={glyphSize} />
    </Pressable>
  ) : null;

  const trailingActions = (
    <View style={styles.actionsRow}>
      {aiAttachButton}
      {scanButton}
      {micButton}      <Pressable
        onPress={submit}
        disabled={sendDisabled}
        style={[
          iconBtnStyle,
          iconBtnMobile,
          {
            backgroundColor: colors.primary,
            opacity: sendDisabled ? 0.45 : 1,
          },
        ]}
      >
        {sending ? (
          <ActivityIndicator color={colors.primaryForeground} size="small" />
        ) : (
          <Send color={colors.primaryForeground} size={glyphSize} />
        )}
      </Pressable>
    </View>
  );

  const aiAttachmentPreview =
    aiAttachment && onRemoveAiAttachment ? (
      <View style={[styles.aiPreview, { borderColor: colors.border, backgroundColor: colors.muted }]}>
        {aiAttachment.isPdf || !aiAttachment.previewUri ? (
          <FileText color={colors.primary} size={20} />
        ) : (
          <Image source={{ uri: aiAttachment.previewUri }} style={styles.aiPreviewThumb} />
        )}
        <Text style={{ color: colors.foreground, fontSize: 13, flex: 1 }} numberOfLines={1}>
          {aiAttachment.name}
        </Text>
        <Pressable onPress={onRemoveAiAttachment} hitSlop={8}>
          <X color={colors.mutedForeground} size={16} />
        </Pressable>
      </View>
    ) : null;

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
        {aiAttachmentPreview}
        <View style={[mobileWebComposerStyles.row, { alignItems: "center" }]}>
          <AppTextInput
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
          {trailingActions}
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
      {aiAttachmentPreview}
      <View style={styles.composerRow}>
        <AppTextInput
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
      {trailingActions}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  wrapCompact: {
    paddingHorizontal: 12,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  aiPreviewThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexShrink: 0,
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
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconMobileWeb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
