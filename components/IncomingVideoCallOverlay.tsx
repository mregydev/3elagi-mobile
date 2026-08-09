import { useRouter } from "expo-router";
import { Phone, PhoneOff } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Logo3elagi } from "@/components/Logo3elagi";
import { useAuthStore } from "@/domains/auth/store";
import { onIncomingVideoCall, onVideoCallStatus } from "@/domains/presence/socket";
import { acceptVideoCall, declineVideoCall } from "@/domains/video-call/api";
import { useI18n } from "@/hooks/useI18n";

type IncomingCall = {
  sessionId: string;
  callerId?: string;
  callerName?: string;
};

export function IncomingVideoCallOverlay() {
  const { isRTL } = useI18n();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);

  const isDoctor = role?.toLowerCase() === "doctor";

  useEffect(() => {
    onIncomingVideoCall((payload) => {
      if (!isDoctor) return;
      setIncoming({
        sessionId: payload.session_id,
        callerId: payload.caller_id,
        callerName: payload.caller_name,
      });
    });
    return () => onIncomingVideoCall(null);
  }, [isDoctor]);

  // Caller hung up before we answered — stop ringing.
  useEffect(() => {
    onVideoCallStatus((payload) => {
      setIncoming((current) =>
        current && current.sessionId === payload.session_id ? null : current,
      );
    });
    return () => onVideoCallStatus(null);
  }, []);

  const dismiss = () => {
    setBusy(null);
    setIncoming(null);
  };

  const handleAccept = async () => {
    if (!accessToken || !incoming || busy) return;
    setBusy("accept");
    try {
      await acceptVideoCall(accessToken, incoming.sessionId);
      dismiss();
      router.push({
        pathname: "/video-call",
        params: { sessionId: incoming.sessionId },
      });
    } catch {
      dismiss();
    }
  };

  const handleReject = async () => {
    if (!accessToken || !incoming || busy) return;
    setBusy("reject");
    try {
      await declineVideoCall(accessToken, incoming.sessionId);
    } catch {
      // ignore
    } finally {
      dismiss();
    }
  };

  if (!incoming || !isDoctor) return null;

  const callerName = incoming.callerName?.trim() || (isRTL ? "مريض" : "Patient");

  return (
    <Modal visible transparent animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: "rgba(8, 15, 30, 0.9)" }]}>
        <View style={styles.content}>
          <Logo3elagi height={64} centered />
          <Text style={[styles.title, { color: "#fff" }]}>
            {isRTL ? "مكالمة فيديو واردة" : "Incoming video call"}
          </Text>
          <Text style={[styles.name, { color: "#fff" }]}>{callerName}</Text>
          <Text style={[styles.subtitle, { color: "rgba(255,255,255,0.78)" }]}>
            {isRTL ? "يريد بدء مكالمة الآن" : "wants to start a call now"}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={() => void handleReject()}
              disabled={!!busy}
              style={[styles.circleBtn, { backgroundColor: "#ef4444", opacity: busy ? 0.7 : 1 }]}
            >
              {busy === "reject" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <PhoneOff size={28} color="#fff" />
              )}
            </Pressable>
            <Pressable
              onPress={() => void handleAccept()}
              disabled={!!busy}
              style={[styles.circleBtn, { backgroundColor: "#22c55e", opacity: busy ? 0.7 : 1 }]}
            >
              {busy === "accept" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Phone size={28} color="#fff" />
              )}
            </Pressable>
          </View>

          <View style={styles.labels}>
            <Text style={[styles.actionLabel, { color: "rgba(255,255,255,0.84)" }]}>
              {isRTL ? "رفض" : "Reject"}
            </Text>
            <Text style={[styles.actionLabel, { color: "rgba(255,255,255,0.84)" }]}>
              {isRTL ? "قبول" : "Accept"}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 22,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  name: {
    marginTop: 18,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    textAlign: "center",
  },
  actions: {
    marginTop: 44,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  circleBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  labels: {
    marginTop: 14,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "700",
    minWidth: 84,
    textAlign: "center",
  },
});
