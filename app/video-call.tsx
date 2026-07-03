import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
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
import { useAuthStore } from "@/domains/auth/store";
import {
  acceptVideoCall,
  endVideoCall,
  fetchVideoCallSession,
  toWherebyEmbedUrl,
  type VideoCallSession,
} from "@/domains/video-call/api";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { chatFlexRow } from "@/utils/rtl";

function readParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function VideoCallScreen() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.role);
  const params = useLocalSearchParams<{
    sessionId?: string | string[];
    meetingUrl?: string | string[];
  }>();

  const sessionId = readParam(params.sessionId);
  const meetingUrlParam = readParam(params.meetingUrl);

  const isDoctor = role?.toLowerCase() === "doctor";
  const isPatient = role?.toLowerCase() === "patient";
  const [session, setSession] = useState<VideoCallSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
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

      let next = await fetchVideoCallSession(accessToken, sessionId);
      if (isDoctor && next.status === "ringing") {
        next = await acceptVideoCall(accessToken, next.id);
      }

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
    return clearPoll;
  }, [loadSession, clearPoll]);

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
    if (accessToken && session?.id) {
      void endVideoCall(accessToken, session.id).catch(() => undefined);
    }
    router.back();
  };

  const rowDir = chatFlexRow();
  const peerName =
    session && isDoctor
      ? session.patientName
      : session?.doctorName ?? (isRTL ? "الطبيب" : "Doctor");
  const displayName = profile?.name?.trim() || (isRTL ? "مستخدم" : "User");
  const canJoin =
    !!session?.roomUrl &&
    (session.status === "accepted" || (isDoctor && session.status !== "declined"));
  const waitingForDoctor =
    !!session && isPatient && session.status === "ringing";

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
        ) : waitingForDoctor ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
              {isRTL
                ? `جاري الاتصال بـ ${peerName}…`
                : `Calling ${peerName}…`}
            </Text>
          </View>
        ) : canJoin ? (
          <WherebyMeetingEmbed
            roomUrl={session.roomUrl}
            embedUrl={toWherebyEmbedUrl(session.roomUrl, displayName)}
          />
        ) : null}
      </View>
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
});
