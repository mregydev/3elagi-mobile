import { Audio } from "expo-av";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Beaker, ChevronRight, ImageIcon, Play, ScanLine, Stethoscope } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { ChatMessage } from "@/domains/chat/types";
import type { MessageEmotionType } from "@/domains/emotions/types";
import { MessageEmotionsBar } from "@/components/MessageEmotionsBar";
import { useColors } from "@/hooks/useColors";

interface Props {
  item: ChatMessage;
  mine: boolean;
  isRTL: boolean;
  rowDir: "row" | "row-reverse";
  patientUserId?: string;
  canOpenMedicalLink?: boolean;
  onImagePress?: (uri: string) => void;
  onLongPress?: () => void;
  onEmotionToggle?: (emotion: MessageEmotionType) => void;
  selfUserId?: string | null;
  highlighted?: boolean;
}

export function ChatMessageBubble({
  item,
  mine,
  isRTL,
  rowDir,
  patientUserId,
  canOpenMedicalLink = true,
  onImagePress,
  onLongPress,
  onEmotionToggle,
  selfUserId,
  highlighted = false,
}: Props) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const [playing, setPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const maxBubbleWidth = useMemo(() => Math.round(screenWidth * 0.78), [screenWidth]);
  const imageWidth = useMemo(() => Math.min(240, maxBubbleWidth), [maxBubbleWidth]);
  const imageHeight = useMemo(() => Math.round(imageWidth * 0.72), [imageWidth]);

  const openMedicalLink = () => {
    if (!item.medicalLink) return;
    if (!canOpenMedicalLink) {
      Alert.alert(
        isRTL ? "لا يوجد صلاحية" : "No access",
        isRTL
          ? "المريض لم يمنحك صلاحية عرض السجل الطبي بعد."
          : "The patient has not granted permission to view medical records yet.",
      );
      return;
    }
    router.push({
      pathname: "/medical/[id]",
      params: {
        id: item.medicalLink.record_id,
        doctorView: patientUserId ? "1" : "0",
        patientUserId: patientUserId ?? "",
      },
    });
  };

  const playVoice = async () => {
    if (!item.attachmentUrl || playing || item.pending) return;
    setPlaying(true);
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: item.attachmentUrl });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlaying(false);
          void sound.unloadAsync();
        }
      });
      await sound.playAsync();
    } catch {
      setPlaying(false);
    }
  };

  const isAccessAction = item.type === "access_action";
  const isImage = item.type === "image" && !!(item.localAttachmentUrl ?? item.attachmentUrl);
  const isMedicalLink = item.type === "medical_link" && !!item.medicalLink;
  const medicalBubbleWidth = Math.min(300, maxBubbleWidth);

  const bubbleColors = isImage
    ? { backgroundColor: "transparent" }
    : isMedicalLink
      ? {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        }
      : mine
        ? { backgroundColor: colors.primary }
        : {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
          };

  const textColor = isMedicalLink ? colors.foreground : mine ? "#fff" : colors.foreground;
  const imageUri = item.localAttachmentUrl ?? item.attachmentUrl;

  let body: React.ReactNode = (
    <View>
      <Text
        style={{
          color: textColor,
          fontSize: 14,
          lineHeight: 20,
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {item.text}
      </Text>
      {item.editedAt ? (
        <Text
          style={{
            color: mine ? "rgba(255,255,255,0.65)" : colors.mutedForeground,
            fontSize: 10,
            fontStyle: "italic",
            marginTop: 4,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {isRTL ? "تم التعديل" : "Edited"}
        </Text>
      ) : null}
    </View>
  );

  if (isImage && imageUri) {
    const showLoader = item.pending || !imageLoaded;
    body = (
      <Pressable
        onPress={() => {
          const fullUri = item.attachmentUrl ?? item.localAttachmentUrl;
          if (!fullUri || item.pending) return;
          onImagePress?.(fullUri);
        }}
        onLongPress={onLongPress}
        delayLongPress={400}
        disabled={item.pending || !(item.attachmentUrl ?? item.localAttachmentUrl)}
        style={{ width: imageWidth, height: imageHeight }}
      >
        <View style={[styles.mediaWrap, { width: imageWidth, height: imageHeight }]}>
          {!imageLoaded ? (
            <View
              style={[
                styles.mediaPlaceholder,
                { backgroundColor: colors.muted },
              ]}
            >
              <ImageIcon size={28} color={colors.mutedForeground} />
            </View>
          ) : null}
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.media,
              { width: imageWidth, height: imageHeight },
              !imageLoaded && styles.mediaHidden,
            ]}
            contentFit="cover"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
          {showLoader ? (
            <View style={styles.mediaOverlay}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: "#fff", fontSize: 12, marginTop: 6 }}>
                {item.pending
                  ? isRTL
                    ? "جاري الإرسال…"
                    : "Sending…"
                  : isRTL
                    ? "جاري التحميل…"
                    : "Loading…"}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  } else if (item.type === "video" && item.attachmentUrl) {
    body = (
      <Pressable
        onPress={() => Linking.openURL(item.attachmentUrl!)}
        onLongPress={onLongPress}
        delayLongPress={400}
        disabled={item.pending}
      >
        <Text style={{ color: textColor, fontWeight: "600" }}>
          {item.pending
            ? isRTL
              ? "جاري إرسال الفيديو…"
              : "Sending video…"
            : isRTL
              ? "▶ تشغيل الفيديو"
              : "▶ Play video"}
        </Text>
      </Pressable>
    );
  } else if (item.type === "voice") {
    body = (
      <Pressable
        onPress={playVoice}
        onLongPress={onLongPress}
        delayLongPress={400}
        disabled={item.pending || !item.attachmentUrl}
        style={[styles.voiceRow, { flexDirection: rowDir }]}
      >
        {item.pending ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Play size={16} color={textColor} />
        )}
        <Text style={{ color: textColor }}>
          {item.pending
            ? isRTL
              ? "جاري الإرسال…"
              : "Sending…"
            : playing
              ? isRTL
                ? "جاري التشغيل…"
                : "Playing…"
              : isRTL
                ? "رسالة صوتية"
                : "Voice message"}
        </Text>
      </Pressable>
    );
  } else if (isMedicalLink && item.medicalLink) {
    const link = item.medicalLink;
    const typeLabel =
      link.record_type === "lab"
        ? isRTL
          ? "نتيجة مختبر"
          : "Lab result"
        : link.record_type === "xray"
          ? isRTL
            ? "أشعة / مسح"
            : "X-ray / scan"
          : isRTL
            ? "تشخيص"
            : "Diagnosis";
    const RecordIcon =
      link.record_type === "lab" ? Beaker : link.record_type === "xray" ? ScanLine : Stethoscope;
    const title = link.title?.trim() || (isRTL ? "سجل طبي" : "Medical record");
    const legacyNote =
      item.text?.trim() && item.text.trim() !== title ? item.text.trim() : "";
    const noteText = link.note?.trim() || legacyNote;
    const showNote = !!noteText;

    body = (
      <View style={styles.medicalBody}>
        {showNote ? (
          <Text
            style={[
              styles.medicalNote,
              {
                color: textColor,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {noteText}
          </Text>
        ) : null}
        <Pressable
          onPress={openMedicalLink}
          onLongPress={onLongPress}
          delayLongPress={400}
          style={({ pressed }) => [
            styles.medicalCard,
            {
              flexDirection: rowDir,
              opacity: pressed ? 0.85 : 1,
              backgroundColor: `${colors.primary}08`,
              borderColor: `${colors.primary}22`,
            },
          ]}
        >
        <View
          style={[
            styles.medicalIconWrap,
            { backgroundColor: `${colors.primary}15` },
          ]}
        >
          <RecordIcon size={20} color={colors.primary} />
        </View>

        <View style={styles.medicalTextWrap}>
          <Text
            style={[
              styles.medicalType,
              { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {typeLabel}
          </Text>
          <Text
            style={[
              styles.medicalTitle,
              { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.medicalHint,
              { color: colors.primary, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {isRTL ? "اضغط للعرض" : "Tap to view"}
          </Text>
        </View>

        <ChevronRight size={18} color={colors.primary} />
        </Pressable>
        {item.editedAt ? (
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 10,
              fontStyle: "italic",
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {isRTL ? "تم التعديل" : "Edited"}
          </Text>
        ) : null}
      </View>
    );
  }

  if (item.failed) {
    body = (
      <Text style={{ color: "#ef4444", fontSize: 13 }}>
        {isRTL ? "تعذر إرسال الرسالة" : "Failed to send"}
      </Text>
    );
  }

  if (isAccessAction) {
    return (
      <View style={styles.accessRow}>
        <View style={[styles.accessPill, { backgroundColor: `${colors.muted}cc` }]}>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 12,
              lineHeight: 17,
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          alignSelf: mine ? "flex-end" : "flex-start",
          maxWidth: maxBubbleWidth,
        },
        (item.emotions?.length ?? 0) > 0 && styles.wrapWithReactions,
      ]}
    >
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={400}
        disabled={!onLongPress}
        style={({ pressed }) => [
          styles.bubble,
          isImage && styles.imageBubble,
          isMedicalLink && styles.medicalBubble,
          bubbleColors,
          isMedicalLink && { width: medicalBubbleWidth, maxWidth: "100%" },
          highlighted && {
            borderWidth: 2,
            borderColor: colors.primary,
          },
          pressed && onLongPress ? { opacity: 0.92 } : null,
        ]}
      >
        {body}
      </Pressable>
      <MessageEmotionsBar
        emotions={item.emotions ?? []}
        selfUserId={selfUserId}
        align={mine ? "left" : "right"}
        onToggle={onEmotionToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    flexShrink: 1,
  },
  wrapWithReactions: {
    marginBottom: 10,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    flexShrink: 1,
  },
  imageBubble: {
    padding: 0,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 0,
  },
  mediaWrap: {
    borderRadius: 12,
    overflow: "hidden",
  },
  mediaPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  media: {
    borderRadius: 12,
  },
  mediaHidden: {
    opacity: 0,
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
  },
  voiceRow: { alignItems: "center", gap: 8 },
  medicalBubble: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  medicalBody: {
    width: "100%",
    gap: 8,
  },
  medicalNote: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  medicalCard: {
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  medicalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  medicalTextWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    gap: 2,
  },
  medicalType: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  medicalTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  medicalHint: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  accessRow: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 4,
  },
  accessPill: {
    maxWidth: "88%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
});
