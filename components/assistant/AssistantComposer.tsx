import { Mic, Send, ImagePlus } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { AppTextInput } from "@/components/AppTextInput";

import { ChatAttachmentPreview } from "@/components/chat/ChatAttachmentPreview";
import {
  MedicalImageAttachOptions,
  type MedicalImageAttachOptionsValue,
} from "@/components/medical/MedicalImageAttachOptions";import {
  MOBILE_WEB_COMPOSER_FOOTER_GAP,
  mobileWebComposerStyles,
} from "@/constants/mobileWebComposer";
import { useColors } from "@/hooks/useColors";
import { handleEnterToSendMessage } from "@/utils/enterToSendMessage";

export interface AssistantPendingImage {
  uri: string;
  mimeType: string;
  fileName: string;
  webFile?: File;
}

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
  onAttachImage?: () => void;
  attachLoading?: boolean;
  pendingImage?: AssistantPendingImage | null;
  onRemovePendingImage?: () => void;
  medicalImageOptions?: MedicalImageAttachOptionsValue;
  onMedicalImageOptionsChange?: (value: MedicalImageAttachOptionsValue) => void;
  canAddMedicalRecord?: boolean;
  onSendImage?: (input: {
    text: string;
    options: MedicalImageAttachOptionsValue;
  }) => void;
  isRTL?: boolean;
  onExpandPendingImage?: (uri: string) => void;
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
  onAttachImage,
  attachLoading = false,
  pendingImage = null,
  onRemovePendingImage,
  medicalImageOptions,
  onMedicalImageOptionsChange,
  canAddMedicalRecord = false,
  onSendImage,
  isRTL = false,
  onExpandPendingImage,
}: Props) {  const colors = useColors();
  const [text, setText] = useState("");
  const recordPulse = useRef(new Animated.Value(1)).current;
  const isMobileWeb = Platform.OS === "web" && compact;
  const bottomPadding = isMobileWeb
    ? MOBILE_WEB_COMPOSER_FOOTER_GAP
    : (compact ? 6 : 12) + bottomInset;

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
    if (pendingImage && onSendImage && medicalImageOptions) {
      onSendImage({ text: value, options: medicalImageOptions });
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
    disabled ||
    sending ||
    (!text.trim() && !pendingImage);
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

  const attachImageButton = onAttachImage ? (    <Pressable
      onPress={onAttachImage}
      disabled={disabled || sending || attachLoading}
      accessibilityRole="button"
      accessibilityLabel="Attach medical image"
      style={[
        iconBtnStyle,
        iconBtnMobile,
        {
          backgroundColor: colors.muted,
          opacity: disabled || sending || attachLoading ? 0.45 : 1,
        },
      ]}
    >
      {attachLoading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <ImagePlus color={colors.primary} size={glyphSize} />
      )}
    </Pressable>
  ) : null;

  const trailingActions = (
    <View style={styles.actionsRow}>
      {attachImageButton}
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

  const previewBlock =
    pendingImage && onRemovePendingImage ? (
      <>
        <ChatAttachmentPreview
          attachment={{ uri: pendingImage.uri, type: "image" }}
          isRTL={isRTL}
          onRemove={onRemovePendingImage}
          onReplace={onAttachImage ?? onRemovePendingImage}
          onExpandImage={onExpandPendingImage ?? (() => {})}
          onExpandVideo={() => {}}
        />
        {canAddMedicalRecord && medicalImageOptions && onMedicalImageOptionsChange ? (
          <MedicalImageAttachOptions
            isRTL={isRTL}
            value={medicalImageOptions}
            onChange={onMedicalImageOptionsChange}
            disabled={disabled || sending || attachLoading}
          />
        ) : null}
      </>
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
        {previewBlock}
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
      {previewBlock}
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
  },  actionsRow: {
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
