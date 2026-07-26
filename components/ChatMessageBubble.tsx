import { Image } from "expo-image";
import { router } from "expo-router";
import { Beaker, Check, CheckCheck, ChevronRight, ClipboardList, ImageIcon, ScanLine, Stethoscope } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { ChatMessage } from "@/domains/chat/types";
import type { MessageEmotionType } from "@/domains/emotions/types";
import { ChatInlineVideo } from "@/components/chat/ChatInlineVideo";
import { VoiceMessagePlayer } from "@/components/chat/VoiceMessagePlayer";
import { MessageEmotionsBar } from "@/components/MessageEmotionsBar";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { formatEgp } from "@/utils/credits";

interface Props {
  item: ChatMessage;
  mine: boolean;
  isRTL: boolean;
  rowDir: "row" | "row-reverse";
  patientUserId?: string;
  canOpenMedicalLink?: boolean;
  isDoctor?: boolean;
  appointmentStatus?: { status: string; meetingLink?: string | null };
  onAppointmentAction?: (
    appointmentId: string,
    action: "confirm" | "reject" | "cancel",
  ) => void;
  appointmentActionBusy?: boolean;
  showAppointmentControls?: boolean;
  onImagePress?: (uri: string) => void;
  onVideoPress?: (uri: string) => void;
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
  isDoctor = false,
  appointmentStatus,
  onAppointmentAction,
  appointmentActionBusy = false,
  showAppointmentControls = false,
  onImagePress,
  onVideoPress,
  onLongPress,
  onEmotionToggle,
  selfUserId,
  highlighted = false,
}: Props) {
  const colors = useColors();
  const { t } = useI18n();
  const { width: screenWidth } = useWindowDimensions();
  const [imageLoaded, setImageLoaded] = useState(false);

  const maxBubbleWidth = useMemo(() => Math.round(screenWidth * 0.78), [screenWidth]);
  const imageWidth = useMemo(() => Math.min(240, maxBubbleWidth), [maxBubbleWidth]);
  const imageHeight = useMemo(() => Math.round(imageWidth * 0.72), [imageWidth]);

  const openMedicalRecord = (recordId: string) => {
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
        id: recordId,
        doctorView: patientUserId ? "1" : "0",
        patientUserId: patientUserId ?? "",
      },
    });
  };

  const openMedicalLink = () => {
    if (!item.medicalLink) return;
    openMedicalRecord(item.medicalLink.record_id);
  };

  const openConsultationDiagnosis = () => {
    const meta = item.consultationAction;
    if (!meta || meta.action !== "end") return;
    const diagnosisId = meta.diagnosis_id?.trim();
    if (!diagnosisId) {
      Alert.alert(
        isRTL ? "لا يوجد تشخيص" : "No diagnosis",
        isRTL
          ? "لا يوجد تشخيص مرتبط بهذه الاستشارة."
          : "There is no diagnosis linked to this consultation.",
      );
      return;
    }
    openMedicalRecord(diagnosisId);
  };

  const isAccessAction = item.type === "access_action";
  const isAppointmentAction = item.type === "appointment_action";
  const isConsultationAction = item.type === "consultation_action";
  const isImage = item.type === "image" && !!(item.localAttachmentUrl ?? item.attachmentUrl);
  const isVideo = item.type === "video" && !!(item.localAttachmentUrl ?? item.attachmentUrl);
  const isMedicalLink = item.type === "medical_link" && !!item.medicalLink;
  const isDocumentRequest = item.type === "document_request" && !!item.documentRequest;
  const medicalBubbleWidth = Math.min(300, maxBubbleWidth);
  const consultationBubbleWidth = Math.min(400, maxBubbleWidth);
  const videoWidth = imageWidth;
  const videoHeight = Math.round(imageWidth * 0.75);
  const responsiveMediaWidth = useMemo(() => {
    if (Platform.OS !== "web") return videoWidth;
    const columnCap = Math.round(maxBubbleWidth * 0.82);
    return Math.min(videoWidth, columnCap, screenWidth - 80);
  }, [maxBubbleWidth, screenWidth, videoWidth]);

  const mediaCaption =
    (isImage || isVideo) && item.text?.trim()
      ? (() => {
          const t = item.text.trim();
          if (t === "Photo" || t === "Video" || t === "Voice message") return null;
          return t;
        })()
      : null;

  const bubbleColors =
    isImage || isVideo
      ? mediaCaption
        ? mine
          ? { backgroundColor: colors.primary }
          : {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            }
        : { backgroundColor: "transparent" }
      : isDocumentRequest
      ? {
          backgroundColor: "transparent",
          borderWidth: 0,
          paddingHorizontal: 0,
          paddingVertical: 0,
        }
      : isMedicalLink || isConsultationAction
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

  const textColor =
    isMedicalLink || isDocumentRequest
      ? colors.foreground
      : mine
        ? "#fff"
        : colors.foreground;
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
      <View>
        <Pressable
          onPress={() => {
            const fullUri = item.attachmentUrl ?? item.localAttachmentUrl;
            if (!fullUri) return;
            onImagePress?.(fullUri);
          }}
          onLongPress={onLongPress}
          delayLongPress={400}
          disabled={!(item.attachmentUrl ?? item.localAttachmentUrl)}
          style={{ width: imageWidth, height: imageHeight }}
        >
          <View style={[styles.mediaWrap, { width: imageWidth, height: imageHeight }]}>
            {!imageLoaded ? (
              <View
                style={[
                  styles.mediaPlaceholder,
                  { backgroundColor: "#111" },
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
        {mediaCaption ? (
          <Text
            style={{
              color: textColor,
              fontSize: 14,
              lineHeight: 20,
              marginTop: 8,
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {mediaCaption}
          </Text>
        ) : null}
      </View>
    );
  } else if (isVideo && imageUri) {
    body = (
      <View style={Platform.OS === "web" ? styles.webMediaFrame : undefined}>
        <ChatInlineVideo
          uri={imageUri}
          width={responsiveMediaWidth}
          height={Math.round(responsiveMediaWidth * 0.75)}
          isRTL={isRTL}
          pending={item.pending}
          onExpand={(uri) => onVideoPress?.(uri)}
          onLongPress={onLongPress}
        />
        {mediaCaption ? (
          <Text
            style={{
              color: textColor,
              fontSize: 14,
              lineHeight: 20,
              marginTop: 8,
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {mediaCaption}
          </Text>
        ) : null}
      </View>
    );
  } else if (item.type === "voice") {
    body = (
      <VoiceMessagePlayer
        uri={item.localAttachmentUrl ?? item.attachmentUrl}
        pending={item.pending}
        color={textColor}
        trackColor={`${textColor}33`}
        fillColor={textColor}
        isRTL={isRTL}
        rowDir={rowDir}
        onLongPress={onLongPress}
      />
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
          : link.record_type === "intake"
            ? isRTL
              ? "فحص متابعة"
              : "Follow-up exam"
            : isRTL
              ? "تشخيص"
              : "Diagnosis";
    const RecordIcon =
      link.record_type === "lab"
        ? Beaker
        : link.record_type === "xray"
          ? ScanLine
          : link.record_type === "intake"
            ? ClipboardList
            : Stethoscope;
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
  } else if (isDocumentRequest && item.documentRequest) {
    const req = item.documentRequest;
    const typeLabel =
      req.request_type === "xray"
        ? isRTL
          ? "طلب أشعة"
          : "X-ray request"
        : isRTL
          ? "طلب تحليل"
          : "Lab request";
    const RecordIcon = req.request_type === "xray" ? ScanLine : Beaker;
    const title = req.title?.trim() || (isRTL ? "طلب مستند" : "Document request");
    const desc = req.description?.trim();

    const openRequest = () => {
      if (req.status === "fulfilled") {
        const documentId = req.fulfilled_document_id?.trim();
        if (!documentId) return;
        openMedicalRecord(documentId);
        return;
      }
      if (req.status === "cancelled") return;
      const requestId = req.request_id?.trim();
      if (!requestId) return;
      router.push({
        pathname: "/medical/request/[id]",
        params: {
          id: requestId,
          ...(isDoctor && patientUserId?.trim()
            ? { patientUserId: patientUserId.trim() }
            : {}),
        },
      } as never);
    };

    body = (
      <Pressable
        onPress={openRequest}
        onLongPress={onLongPress}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.medicalCard,
          styles.documentRequestCard,
          {
            flexDirection: rowDir,
            opacity: pressed ? 0.88 : 1,
            backgroundColor: `${colors.primary}14`,
            borderColor: `${colors.primary}55`,
            width: medicalBubbleWidth,
          },
        ]}
      >
        <View
          style={[
            styles.medicalIconWrap,
            { backgroundColor: `${colors.primary}22` },
          ]}
        >
          <RecordIcon size={20} color={colors.primary} />
        </View>

        <View style={styles.medicalTextWrap}>
          <Text
            style={[
              styles.medicalType,
              { color: colors.primary, textAlign: isRTL ? "right" : "left" },
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
          {desc ? (
            <Text
              style={[
                styles.medicalHint,
                {
                  color: colors.mutedForeground,
                  textAlign: isRTL ? "right" : "left",
                  marginTop: 4,
                },
              ]}
              numberOfLines={3}
            >
              {desc}
            </Text>
          ) : null}
          <Text
            style={[
              styles.medicalHint,
              { color: colors.primary, textAlign: isRTL ? "right" : "left", marginTop: 6 },
            ]}
          >
            {req.status === "fulfilled"
              ? isRTL
                ? "تم رفع النتيجة — اضغط للعرض"
                : "Result uploaded — tap to view"
              : req.status === "cancelled"
                ? isRTL
                  ? "تم إلغاء الطلب"
                  : "Request cancelled"
                : isRTL
                  ? "اضغط لعرض التفاصيل"
                  : "Tap to view details"}
          </Text>
        </View>

        {req.status === "cancelled" ||
        (req.status === "fulfilled" && !req.fulfilled_document_id?.trim()) ? null : (
          <ChevronRight size={18} color={colors.primary} />
        )}
      </Pressable>
    );
  }

  if (item.failed) {
    body = (
      <Text style={{ color: "#ef4444", fontSize: 13 }}>
        {isRTL ? "تعذر إرسال الرسالة" : "Failed to send"}
      </Text>
    );
  }

  if (isConsultationAction && item.consultationAction) {
    const meta = item.consultationAction;
    const title =
      meta.action === "start"
        ? isRTL
          ? "بدأت الاستشارة"
          : "Consultation started"
        : meta.action === "end"
          ? isRTL
            ? "انتهت الاستشارة"
            : "Consultation ended"
          : isRTL
            ? "أُلغيت الاستشارة"
            : "Consultation cancelled";
    const reasonType = meta.cancel_reason_type;
    const reasonLabel =
      reasonType === "video_consultation"
        ? isRTL
          ? "يتطلب استشارة فيديو"
          : "Needs a video consultation"
        : reasonType === "onsite_visit"
          ? isRTL
            ? "يتطلب زيارة العيادة"
            : "Needs an on-site visit"
          : reasonType === "other"
            ? isRTL
              ? "سبب آخر"
              : "Other reason"
            : null;
    const accent =
      meta.action === "cancel"
        ? "#dc2626"
        : meta.action === "end"
          ? "#0d9488"
          : colors.primary;
    const detail =
      meta.action === "start" && meta.reserved_points
        ? t.consultations.reservedInThread(formatEgp(meta.reserved_points, t))
        : reasonLabel;
    const canOpenDiagnosis =
      meta.action === "end" && !!meta.diagnosis_id?.trim();
    const card = (
      <>
        <View style={[styles.medicalIconWrap, { backgroundColor: `${accent}22` }]}>
          <Stethoscope size={20} color={accent} />
        </View>
        <View style={styles.medicalTextWrap}>
          <View style={[styles.consultRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text
              style={[styles.medicalTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {detail ? (
              <Text style={[styles.consultMeta, { color: accent }]} numberOfLines={1}>
                {detail}
              </Text>
            ) : null}
          </View>
          {item.text?.trim() ? (
            <Text
              style={[
                styles.consultDesc,
                { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {item.text.trim()}
            </Text>
          ) : null}
          {meta.action === "end" && meta.diagnosis_summary ? (
            <View style={styles.consultDiagnosis}>
              <Text
                style={[
                  styles.consultDiagnosisHeading,
                  { color: accent, textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {isRTL ? "التشخيص" : "Diagnosis"}
              </Text>
              <Text
                style={[
                  styles.consultDiagnosisDesc,
                  { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {meta.diagnosis_summary.desc}
              </Text>
              {meta.diagnosis_summary.symptoms?.length ? (
                <View style={styles.consultDiagnosisBlock}>
                  <Text
                    style={[
                      styles.consultDiagnosisSub,
                      { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {isRTL ? "الأعراض" : "Symptoms"}
                  </Text>
                  {meta.diagnosis_summary.symptoms.map((symptom, index) => (
                    <Text
                      key={`${symptom.desc}-${index}`}
                      style={[
                        styles.consultDiagnosisLine,
                        { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      • {symptom.desc}
                    </Text>
                  ))}
                </View>
              ) : null}
              {meta.diagnosis_summary.linked_records?.length ? (
                <View style={styles.consultDiagnosisBlock}>
                  <Text
                    style={[
                      styles.consultDiagnosisSub,
                      { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {isRTL ? "نتائج مرتبطة" : "Linked results"}
                  </Text>
                  {meta.diagnosis_summary.linked_records.map((record) => {
                    const typeLabel =
                      record.record_type === "lab"
                        ? isRTL
                          ? "مختبر"
                          : "Lab"
                        : isRTL
                          ? "أشعة"
                          : "X-ray";
                    return (
                      <Text
                        key={record.id}
                        style={[
                          styles.consultDiagnosisLine,
                          { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
                        ]}
                      >
                        {typeLabel}: {record.title}
                      </Text>
                    );
                  })}
                </View>
              ) : null}
            </View>
          ) : null}
          {canOpenDiagnosis ? (
            <Text
              style={[
                styles.medicalHint,
                { color: accent, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {isRTL ? "اضغط لعرض التشخيص" : "Tap to view diagnosis"}
            </Text>
          ) : null}
        </View>
        {canOpenDiagnosis ? <ChevronRight size={18} color={accent} /> : null}
      </>
    );
    body = (
      <View style={styles.medicalBody}>
        {canOpenDiagnosis ? (
          <Pressable
            onPress={openConsultationDiagnosis}
            onLongPress={onLongPress}
            delayLongPress={400}
            style={({ pressed }) => [
              styles.medicalCard,
              {
                flexDirection: rowDir,
                opacity: pressed ? 0.85 : 1,
                backgroundColor: `${accent}0F`,
                borderColor: `${accent}33`,
              },
            ]}
          >
            {card}
          </Pressable>
        ) : (
          <View
            style={[
              styles.medicalCard,
              {
                flexDirection: rowDir,
                backgroundColor: `${accent}0F`,
                borderColor: `${accent}33`,
              },
            ]}
          >
            {card}
          </View>
        )}
      </View>
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

  if (isAppointmentAction && item.appointmentAction) {
    const meta = item.appointmentAction;
    const status = appointmentStatus?.status ?? meta.status ?? "pending";
    const meetingLink = appointmentStatus?.meetingLink ?? meta.meeting_link;
    const joinableStatuses = new Set(["confirmed", "waiting", "active"]);
    const canRespond =
      meta.action === "request" && status === "pending" && isDoctor && !mine;
    const canCancel =
      showAppointmentControls && (status === "pending" || status === "confirmed");
    const canJoinMeeting =
      !!meetingLink &&
      showAppointmentControls &&
      !canRespond &&
      joinableStatuses.has(status);

    return (
      <View style={styles.accessRow}>
        <View style={[styles.accessPill, { backgroundColor: `${colors.muted}cc`, gap: 10 }]}>
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
          {isDoctor && meta.patient_insight ? (
            <View
              style={[
                styles.apptInsight,
                { backgroundColor: colors.card, borderColor: colors.primary },
              ]}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 11,
                  fontWeight: "800",
                  marginBottom: 4,
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {isRTL ? "ملخص الذكاء الاصطناعي عن المريض" : "AI patient insight"}
              </Text>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 12.5,
                  lineHeight: 18,
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {meta.patient_insight}
              </Text>
            </View>
          ) : null}
          {canRespond ? (
            <View style={[styles.apptActions, { flexDirection: rowDir }]}>
              <Pressable
                disabled={appointmentActionBusy}
                onPress={() => onAppointmentAction?.(meta.appointment_id, "confirm")}
                style={[styles.apptBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.apptBtnText}>{isRTL ? "قبول" : "Accept"}</Text>
              </Pressable>
              <Pressable
                disabled={appointmentActionBusy}
                onPress={() => onAppointmentAction?.(meta.appointment_id, "reject")}
                style={[styles.apptBtn, { backgroundColor: colors.destructive }]}
              >
                <Text style={styles.apptBtnText}>{isRTL ? "رفض" : "Reject"}</Text>
              </Pressable>
            </View>
          ) : null}
          {canCancel && onAppointmentAction ? (
            <Pressable
              disabled={appointmentActionBusy}
              onPress={() => onAppointmentAction(meta.appointment_id, "cancel")}
              style={[styles.apptBtnOutline, { borderColor: colors.destructive }]}
            >
              <Text style={{ color: colors.destructive, fontWeight: "700", fontSize: 12 }}>
                {isRTL ? "إلغاء الموعد" : "Cancel appointment"}
              </Text>
            </Pressable>
          ) : null}
          {canJoinMeeting ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/video-call",
                  params: {
                    meetingUrl: meetingLink,
                    ...(meta.duration_minutes
                      ? { durationMinutes: String(meta.duration_minutes) }
                      : {}),
                    ...(patientUserId ? { patientUserId } : {}),
                  },
                })
              }
              style={[styles.apptBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.apptBtnText}>{isRTL ? "انضم للاجتماع" : "Join meeting"}</Text>
            </Pressable>
          ) : null}
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
          isVideo && styles.imageBubble,
          isMedicalLink && styles.medicalBubble,
          isDocumentRequest && styles.documentRequestBubble,
          isConsultationAction && styles.medicalBubble,
          bubbleColors,
          isMedicalLink && { width: medicalBubbleWidth, maxWidth: "100%" },
          isDocumentRequest && { width: medicalBubbleWidth, maxWidth: "100%" },
          isConsultationAction && { width: consultationBubbleWidth, maxWidth: "100%" },
          highlighted && {
            borderWidth: 2,
            borderColor: colors.primary,
          },
          pressed && onLongPress ? { opacity: 0.92 } : null,
        ]}
      >
        {body}
        {mine && !item.pending && !isAccessAction ? (
          <View style={[styles.readRow, { flexDirection: rowDir }]}>
            {item.readAt ? (
              <CheckCheck size={14} color={mine ? "rgba(255,255,255,0.9)" : colors.primary} />
            ) : (
              <Check size={14} color={mine ? "rgba(255,255,255,0.65)" : colors.mutedForeground} />
            )}
          </View>
        ) : null}
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
  webMediaFrame: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  mediaWrap: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
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
  readRow: {
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  medicalBubble: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  documentRequestBubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    overflow: "visible",
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
  documentRequestCard: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
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
  consultRow: {
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  consultMeta: {
    fontSize: 12,
    fontWeight: "700",
  },
  consultDesc: {
    fontSize: 13,
    lineHeight: 17,
    marginTop: 2,
  },
  consultDiagnosis: {
    marginTop: 10,
    gap: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  consultDiagnosisHeading: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  consultDiagnosisDesc: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  consultDiagnosisBlock: {
    marginTop: 6,
    gap: 2,
  },
  consultDiagnosisSub: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  consultDiagnosisLine: {
    fontSize: 13,
    lineHeight: 18,
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
  apptActions: {
    gap: 8,
    justifyContent: "center",
  },
  apptInsight: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  apptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  apptBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  apptBtnOutline: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
});
