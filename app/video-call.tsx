import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Pill, Phone, PhoneOff, Stethoscope } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo3elagi } from "@/components/Logo3elagi";
import { WherebyMeetingEmbed } from "@/components/video-call/WherebyMeetingEmbed";
import { DiagnosisChatModal } from "@/components/DiagnosisChatModal";
import { useAuthStore } from "@/domains/auth/store";
import { createDiagnosis } from "@/domains/medical/api";
import {
  acceptVideoCall,
  declineVideoCall,
  endVideoCall,
  fetchVideoCallSession,
  toVideoEmbedUrl,
  type VideoCallSession,
} from "@/domains/video-call/api";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { chatFlexRow } from "@/utils/rtl";
import { showInfoToast, showSuccessToast, showErrorToast } from "@/utils/toast";

const MEETING_DURATION_SEC = 30 * 60;
const WARNING_REMAINING_SEC = 5 * 60;

function readParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatRemainingTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function VideoCallScreen() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.role);
  const doctorId = useAuthStore((s) => s.doctorId);
  const [diagnosisOpen, setDiagnosisOpen] = useState(false);
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const params = useLocalSearchParams<{
    sessionId?: string | string[];
    meetingUrl?: string | string[];
    patientUserId?: string | string[];
  }>();

  const sessionId = readParam(params.sessionId);
  const meetingUrlParam = readParam(params.meetingUrl);
  const patientUserIdParam = readParam(params.patientUserId);

  const isDoctor = role?.toLowerCase() === "doctor";
  const isPatient = role?.toLowerCase() === "patient";
  const [session, setSession] = useState<VideoCallSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<"accept" | "reject" | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSessionKeyRef = useRef<string | null>(null);
  const warningShownRef = useRef(false);
  const endingRef = useRef(false);
  const [remainingSeconds, setRemainingSeconds] = useState(MEETING_DURATION_SEC);
  const [meetingExpired, setMeetingExpired] = useState(false);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const clearMeetingTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const loadSession = useCallback(async () => {
    if (!accessToken) {
      setError(isRTL ? "تعذر بدء المكالمة" : "Could not start the video call");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (meetingUrlParam) {
        setSession({
          id: "direct",
          status: "accepted",
          roomUrl: meetingUrlParam,
          patientUserId: "",
          doctorUserId: "",
          patientName: "",
          doctorName: "",
        });
        return;
      }

      if (!sessionId) {
        throw new Error(
          isRTL ? "بيانات المكالمة غير متوفرة" : "Call details are missing",
        );
      }

      const next = await fetchVideoCallSession(accessToken, sessionId);
      setSession(next);
    } catch (e) {
      setSession(null);
      setError(
        e instanceof Error
          ? e.message
          : isRTL
            ? "تعذر إنشاء غرفة المكالمة"
            : "Could not create the meeting room",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, isDoctor, isRTL, meetingUrlParam, sessionId]);

  useEffect(() => {
    void loadSession();
    return () => {
      clearPoll();
      clearMeetingTimer();
    };
  }, [loadSession, clearMeetingTimer, clearPoll]);

  useEffect(() => {
    clearPoll();
    if (!accessToken || !session || session.status !== "ringing" || !isPatient) {
      return;
    }

    pollRef.current = setInterval(() => {
      void fetchVideoCallSession(accessToken, session.id)
        .then((next) => {
          setSession(next);
          if (next.status !== "ringing") clearPoll();
        })
        .catch(() => undefined);
    }, 2000);

    return clearPoll;
  }, [accessToken, clearPoll, isPatient, session?.id, session?.status]);

  const handleLeave = () => {
    clearMeetingTimer();
    if (accessToken && session?.id && session.id !== "direct") {
      void endVideoCall(accessToken, session.id).catch(() => undefined);
    }
    router.back();
  };

  const handleAccept = async () => {
    if (!accessToken || !session || acting) return;
    setActing("accept");
    try {
      const next = await acceptVideoCall(accessToken, session.id);
      setSession(next);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : isRTL
            ? "تعذر قبول المكالمة"
            : "Could not accept the call",
      );
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    if (!accessToken || !session || acting) return;
    setActing("reject");
    try {
      await declineVideoCall(accessToken, session.id);
      router.back();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : isRTL
            ? "تعذر رفض المكالمة"
            : "Could not reject the call",
      );
      setActing(null);
    }
  };

  const handleDiagnosisSubmit = async (
    payload: import("@/components/DiagnosisChatForm").DiagnosisSubmitPayload,
  ) => {
    const targetPatientId = session?.patientUserId?.trim() || patientUserIdParam;
    if (!accessToken || !doctorId || !targetPatientId) return;
    setSavingDiagnosis(true);
    try {
      await createDiagnosis(
        {
          desc: payload.description,
          patient_id: targetPatientId,
          doctor_id: doctorId,
          symptoms: payload.symptoms.map((desc) => ({ desc })),
          document_ids:
            payload.documentIds.length > 0 ? payload.documentIds : undefined,
          body_part: payload.bodyPart,
          prescription_id: payload.prescription_id,
          prescription: payload.prescription,
          intake_exam_assignment_id: payload.intake_exam_assignment_id,
          intake_exam: payload.intake_exam,
        },
        accessToken,
      );
      setDiagnosisOpen(false);
      showSuccessToast(isRTL ? "تم حفظ التشخيص" : "Diagnosis saved");
    } catch (e) {
      showErrorToast(
        isRTL ? "تعذر حفظ التشخيص" : "Could not save diagnosis",
        e instanceof Error ? e.message : undefined,
      );
    } finally {
      setSavingDiagnosis(false);
    }
  };

  const rowDir = chatFlexRow();
  const peerName =
    session && isDoctor
      ? session.patientName
      : session?.doctorName ?? (isRTL ? "الطبيب" : "Doctor");
  const displayName = profile?.name?.trim() || (isRTL ? "مستخدم" : "User");
  const canJoin = !!session?.roomUrl && session.status === "accepted" && !meetingExpired;
  const diagPatientId = session?.patientUserId?.trim() || patientUserIdParam || null;
  const canAddClinicalNotes =
    isDoctor && canJoin && !!diagPatientId && !!accessToken;
  const waitingForDoctor =
    !!session && isPatient && session.status === "ringing";
  const incomingForDoctor =
    !!session && isDoctor && session.status === "ringing";
  const countdownLabel = formatRemainingTime(remainingSeconds);

  const endMeetingForTimeout = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    clearMeetingTimer();
    setMeetingExpired(true);
    setRemainingSeconds(0);
    if (accessToken && session?.id && session.id !== "direct") {
      void endVideoCall(accessToken, session.id)
        .then((next) => setSession(next))
        .catch(() => undefined);
    }
  }, [accessToken, clearMeetingTimer, session?.id]);

  useEffect(() => {
    if (!canJoin || !session?.roomUrl) {
      clearMeetingTimer();
      if (!meetingExpired) {
        setRemainingSeconds(MEETING_DURATION_SEC);
      }
      return;
    }

    const sessionKey = `${session.id}:${session.roomUrl}`;
    if (timerSessionKeyRef.current !== sessionKey) {
      timerSessionKeyRef.current = sessionKey;
      warningShownRef.current = false;
      endingRef.current = false;
      setMeetingExpired(false);
      setRemainingSeconds(MEETING_DURATION_SEC);
    }

    clearMeetingTimer();
    timerRef.current = setInterval(() => {
      setRemainingSeconds((current) => {
        const next = Math.max(0, current - 1);
        if (next <= WARNING_REMAINING_SEC && next > 0 && !warningShownRef.current) {
          warningShownRef.current = true;
          showInfoToast(
            isRTL ? "ستنتهي المكالمة قريبًا" : "Meeting ending soon",
            isRTL
              ? "سيتم إغلاق الاجتماع بعد 5 دقائق."
              : "This meeting will be closed after 5 minutes.",
          );
        }
        if (next === 0) {
          endMeetingForTimeout();
        }
        return next;
      });
    }, 1000);

    return clearMeetingTimer;
  }, [
    canJoin,
    clearMeetingTimer,
    endMeetingForTimeout,
    isRTL,
    meetingExpired,
    session?.id,
    session?.roomUrl,
  ]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
            flexDirection: rowDir,
          },
        ]}
      >
        <Pressable
          onPress={handleLeave}
          accessibilityRole="button"
          accessibilityLabel={isRTL ? "رجوع" : "Back"}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>

        <View style={[styles.brandRow, { flexDirection: rowDir }]}>
          <Logo3elagi height={28} markOnly />
          <View style={styles.brandText}>
            <Text style={[styles.appName, { color: colors.foreground }]}>
              3elagi
            </Text>
            <Text
              style={[styles.doctorName, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {peerName}
            </Text>
          </View>
        </View>

        {canAddClinicalNotes ? (
          <View style={[styles.clinicalActions, { flexDirection: rowDir }]}>
            <Pressable
              onPress={() => setDiagnosisOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={isRTL ? "إضافة تشخيص" : "Add diagnosis"}
              style={[styles.diagnosisBtn, { backgroundColor: colors.primary }]}
            >
              <Stethoscope size={16} color="#fff" />
              <Text style={styles.diagnosisBtnText}>
                {isRTL ? "تشخيص" : "Diagnosis"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/medical/prescription/add",
                  params: { patientUserId: diagPatientId! },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={isRTL ? "إضافة روشتة" : "Add prescription"}
              style={[
                styles.diagnosisBtn,
                {
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Pill size={16} color={colors.primary} />
              <Text style={[styles.diagnosisBtnText, { color: colors.primary }]}>
                {isRTL ? "روشتة" : "Prescription"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {canJoin ? (
          <View
            style={[
              styles.timerBadge,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>
              {isRTL ? "الوقت المتبقي" : "Time left"}
            </Text>
            <Text style={[styles.timerValue, { color: colors.foreground }]}>
              {countdownLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
              {isRTL ? "جاري إعداد المكالمة…" : "Setting up the call…"}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={[styles.errorTitle, { color: colors.foreground }]}>
              {isRTL ? "تعذر بدء المكالمة" : "Could not start call"}
            </Text>
            <Text style={[styles.errorBody, { color: colors.mutedForeground }]}>
              {error}
            </Text>
            <Pressable
              onPress={() => void loadSession()}
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.retryText}>
                {isRTL ? "إعادة المحاولة" : "Try again"}
              </Text>
            </Pressable>
          </View>
        ) : session?.status === "declined" ? (
          <View style={styles.center}>
            <Text style={[styles.errorTitle, { color: colors.foreground }]}>
              {isRTL ? "لم يتم الرد على المكالمة" : "Call was not answered"}
            </Text>
          </View>
        ) : meetingExpired ? (
          <View style={styles.center}>
            <Text style={[styles.errorTitle, { color: colors.foreground }]}>
              {isRTL ? "انتهى وقت الاجتماع" : "Meeting time ended"}
            </Text>
            <Text style={[styles.errorBody, { color: colors.mutedForeground }]}>
              {isRTL
                ? "تم إغلاق غرفة الاجتماع بعد 30 دقيقة."
                : "The meeting room was closed after 30 minutes."}
            </Text>
          </View>
        ) : waitingForDoctor ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
              {isRTL
                ? `جاري الاتصال بـ ${peerName}…`
                : `Calling ${peerName}…`}
            </Text>
          </View>
        ) : incomingForDoctor ? (
          <View style={styles.center}>
            <Logo3elagi height={72} centered />
            <Text style={[styles.errorTitle, { color: colors.foreground, marginTop: 18 }]}>
              {isRTL ? "مكالمة فيديو واردة" : "Incoming video call"}
            </Text>
            <Text style={[styles.callerName, { color: colors.foreground }]}>
              {peerName}
            </Text>
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
              {isRTL ? "اضغط قبول لبدء المكالمة" : "Tap accept to start the call"}
            </Text>
            <View style={styles.incomingActions}>
              <Pressable
                onPress={() => void handleReject()}
                disabled={!!acting}
                style={[styles.callActionBtn, { backgroundColor: "#ef4444", opacity: acting ? 0.7 : 1 }]}
              >
                {acting === "reject" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <PhoneOff size={28} color="#fff" />
                )}
              </Pressable>
              <Pressable
                onPress={() => void handleAccept()}
                disabled={!!acting}
                style={[styles.callActionBtn, { backgroundColor: "#22c55e", opacity: acting ? 0.7 : 1 }]}
              >
                {acting === "accept" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Phone size={28} color="#fff" />
                )}
              </Pressable>
            </View>
            <View style={styles.incomingLabels}>
              <Text style={[styles.incomingLabel, { color: colors.mutedForeground }]}>
                {isRTL ? "رفض" : "Reject"}
              </Text>
              <Text style={[styles.incomingLabel, { color: colors.mutedForeground }]}>
                {isRTL ? "قبول" : "Accept"}
              </Text>
            </View>
          </View>
        ) : canJoin ? (
          <WherebyMeetingEmbed
            roomUrl={session.roomUrl}
            embedUrl={toVideoEmbedUrl(session.roomUrl, displayName)}
          />
        ) : null}
      </View>

      {canAddClinicalNotes && diagPatientId && accessToken ? (
        <DiagnosisChatModal
          visible={diagnosisOpen}
          isRTL={isRTL}
          patientUserId={diagPatientId}
          accessToken={accessToken}
          saving={savingDiagnosis}
          onClose={() => {
            if (savingDiagnosis) return;
            setDiagnosisOpen(false);
          }}
          onSubmit={(payload) => void handleDiagnosisSubmit(payload)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  brandRow: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  brandText: {
    flex: 1,
    minWidth: 0,
  },
  timerBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "flex-end",
    minWidth: 92,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  timerValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "800",
  },
  appName: {
    fontSize: 16,
    fontWeight: "800",
  },
  doctorName: {
    fontSize: 13,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  clinicalActions: {
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  diagnosisBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  diagnosisBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    textAlign: "center",
  },
  callerName: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  incomingActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
    marginTop: 24,
  },
  callActionBtn: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
  },
  incomingLabels: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 58,
    marginTop: 12,
  },
  incomingLabel: {
    fontSize: 14,
    fontWeight: "700",
    minWidth: 82,
    textAlign: "center",
  },
});
