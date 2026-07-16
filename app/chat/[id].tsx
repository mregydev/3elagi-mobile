import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Calendar, FileText, Pill, Stethoscope } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { ChatReactionOverlay, type ReactionAnchor } from "@/components/ChatReactionOverlay";
import { Avatar } from "@/components/Avatar";
import { ChatComposer } from "@/components/ChatComposer";
import { ConsultationBar } from "@/components/ConsultationBar";
import { ChatAccessBanner } from "@/components/ChatAccessBanner";
import { BookAppointmentDialog } from "@/components/BookAppointmentDialog";
import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { DiagnosisChatModal } from "@/components/DiagnosisChatModal";
import { AssignIntakeExamDialog } from "@/components/intake/AssignIntakeExamDialog";
import { AssistantCreateRecordDialog } from "@/components/assistant/AssistantCreateRecordDialog";
import { FullscreenImageViewer } from "@/components/FullscreenImageViewer";
import { FullscreenVideoViewer } from "@/components/FullscreenVideoViewer";
import { MedicalRecordPicker } from "@/components/MedicalRecordPicker";
import { usePresenceStore } from "@/domains/presence/store";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import {
  applyLivePresence,
  formatPresenceLabel,
  presenceTextColor,
} from "@/domains/chat/presence";
import { useChatStore } from "@/domains/chat/store";
import {
  connectConversationSocket,
  disconnectConversationSocket,
} from "@/domains/chat/conversationSocket";
import { buildLoggedInUser } from "@/domains/presence/user";
import {
  canDoctorViewPatientRecords,
  fetchDoctorPatientAccess,
  type AccessActionType,
  type DoctorPatientAccessStatus,
} from "@/domains/chat/access";
import type { ChatMessage, MedicalLinkMeta, SendMessageInput } from "@/domains/chat/types";
import { mapMessageRow } from "@/domains/chat/api";
import { sendAppointmentAction } from "@/domains/appointments/api";
import { onChatAccessUpdated } from "@/domains/presence/socket";
import type { MedicalRecord } from "@/domains/medical/types";
import { createDiagnosis, fetchAllMedicalHistory } from "@/domains/medical/api";
import { mapInstance } from "@/domains/intake-exams/api";
import { useMedicalStore } from "@/domains/medical/store";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { setMessageEmotion } from "@/domains/emotions/api";
import { mapEmotionRows, type MessageEmotionType } from "@/domains/emotions/types";
import { showChatMessageActions } from "@/utils/chatMessageActions";
import { leaveChatToHistory } from "@/utils/chatNavigation";
import { scrollChatToLatest } from "@/utils/chatListScroll";
import { chatFlexRow, chatLayoutDirection } from "@/utils/rtl";

const EMPTY_MESSAGES: ChatMessage[] = [];

function canReactToMessage(message: ChatMessage): boolean {
  return !message.pending && !message.failed && !message.id.startsWith("pending-");
}

interface ChatScreenProps {
  /** Desktop web layout inside the sidebar shell — native/mobile web omit this. */
  desktopLayout?: boolean;
}

export default function ChatScreen({ desktopLayout = false }: ChatScreenProps) {
  const colors = useColors();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const role = useAuthStore((s) => s.role);
  const { id: rawPeerId, consultationId: rawConsultationId } =
    useLocalSearchParams<{ id: string; consultationId?: string }>();
  const id = Array.isArray(rawPeerId) ? rawPeerId[0] : rawPeerId;
  const consultationId = Array.isArray(rawConsultationId)
    ? rawConsultationId[0]
    : rawConsultationId;
  const messages = useChatStore((s) => s.messages[id] ?? EMPTY_MESSAGES);
  const messagesLoading = useChatStore((s) => s.messagesLoading[id] ?? false);
  const conversations = useChatStore((s) => s.conversations);
  const loadMessages = useChatStore((s) => s.loadMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const markRead = useChatStore((s) => s.markRead);
  const resolvePeer = useChatStore((s) => s.resolvePeer);
  const ensureContacts = useChatStore((s) => s.ensureContacts);
  const ensurePeer = useChatStore((s) => s.ensurePeer);
  const setActiveChatPeerId = useChatStore((s) => s.setActiveChatPeerId);
  const setPeerTyping = useChatStore((s) => s.setPeerTyping);
  const peerTyping = useChatStore((s) => s.peerTyping[id ?? ""] ?? false);
  const addPendingMessage = useChatStore((s) => s.addPendingMessage);
  const failPendingMessage = useChatStore((s) => s.failPendingMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const editMessage = useChatStore((s) => s.editMessage);
  const editMedicalMessage = useChatStore((s) => s.editMedicalMessage);
  const updateMessageEmotions = useChatStore((s) => s.updateMessageEmotions);
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const doctorId = useAuthStore((s) => s.doctorId);
  const specialty = useAuthStore((s) => s.specialty);
  const specialityId = useAuthStore((s) => s.specialityId);
  const medicalRecords = useMedicalStore((s) => s.records);
  const setRecordsFromApi = useMedicalStore((s) => s.setRecordsFromApi);
  const notifyMedicalHistoryChanged = useMedicalStore((s) => s.notifyMedicalHistoryChanged);
  const [contactsReady, setContactsReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [medicalPickerOpen, setMedicalPickerOpen] = useState(false);
  const [medicalPickerLoading, setMedicalPickerLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [replacingMedicalMessage, setReplacingMedicalMessage] = useState<ChatMessage | null>(null);
  const [medicalPickerMode, setMedicalPickerMode] = useState<"share" | "replace">("share");
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [intakeExamModalOpen, setIntakeExamModalOpen] = useState(false);
  const [assigningIntakeExam, setAssigningIntakeExam] = useState(false);
  const [createMedicalRecordOpen, setCreateMedicalRecordOpen] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<ChatMessage | null>(null);
  const [reactionAnchor, setReactionAnchor] = useState<ReactionAnchor | null>(null);
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [accessStatus, setAccessStatus] = useState<DoctorPatientAccessStatus | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [bookAppointmentOpen, setBookAppointmentOpen] = useState(false);
  const [appointmentActionBusy, setAppointmentActionBusy] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const chatBodyRef = useRef<View>(null);
  const sendingRef = useRef(false);
  const messageAnchorsRef = useRef<Map<string, View>>(new Map());
  const stickToBottomRef = useRef(true);
  const lastMessageTokenRef = useRef("");
  const onlineUsers = usePresenceStore((s) => s.users);

  const peerCacheTick = useChatStore((s) => s.peerCacheTick);
  const peer = useMemo(() => {
    if (!id) return undefined;
    const resolved = resolvePeer(id);
    return resolved ? applyLivePresence(resolved) : undefined;
  }, [id, resolvePeer, conversations, contactsReady, onlineUsers, messages, peerCacheTick]);

  useEffect(() => {
    if (!id || !accessToken || peer?.photoUrl) return;
    void ensurePeer(id, accessToken);
  }, [id, accessToken, peer?.photoUrl, ensurePeer]);

  const isDoctor = role?.toLowerCase() === "doctor";
  const isPatient = role?.toLowerCase() === "patient";
  const canOpenPatientRecord =
    isDoctor &&
    peer?.role === "patient" &&
    canDoctorViewPatientRecords(accessStatus);
  const isDoctorPatientChat =
    (isDoctor && peer?.role === "patient") || (isPatient && peer?.role === "doctor");
  const isDoctorDoctorChat = isDoctor && peer?.role === "doctor";
  const latestConsultationAction = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.type === "consultation_action" && m.consultationAction) {
        return m.consultationAction;
      }
    }
    return null;
  }, [messages]);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [activeConsultationId, setActiveConsultationId] = useState<string | undefined>();
  // Doctor↔patient can only message while a consultation is open.
  const needsConsultation = isDoctorPatientChat && !consultationOpen;
  const canUseDiagnosisTemplates = canOpenPatientRecord && consultationOpen;
  const chatBlocked = !!accessStatus?.is_blocked;
  const patientUserIdForLinks =
    isDoctor && peer?.role === "patient" && accessStatus?.records_allowed
      ? peer.id
      : undefined;
  const canOpenSharedMedicalLinks =
    isDoctor && peer?.role === "patient"
      ? !!accessStatus?.records_allowed && !accessStatus?.is_blocked
      : isDoctorDoctorChat
        ? false
        : true;
  const canAddMedicalRecord =
    !chatBlocked &&
    (isPatient || (isDoctor && !!accessStatus?.records_allowed));
  const medicalRecordPatientUserId = isDoctor ? id : profile?.id;

  useEffect(() => {
    if (!accessToken || !id) return;
    let cancelled = false;
    void (async () => {
      try {
        await ensureContacts(accessToken);
        await ensurePeer(id, accessToken);
      } finally {
        if (!cancelled) setContactsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, id, ensureContacts, ensurePeer]);

  useEffect(() => {
    if (!id) return;
    setActiveChatPeerId(id);
    return () => {
      setActiveChatPeerId(null);
      setPeerTyping(id, false);
    };
  }, [id, setActiveChatPeerId, setPeerTyping]);

  // Each open conversation gets its own dedicated socket (separate from the
  // presence/main socket), connected while this screen is open.
  useEffect(() => {
    if (!id || !accessToken || !profile?.id) return;
    connectConversationSocket({
      peerId: id,
      selfId: profile.id,
      accessToken,
      user: buildLoggedInUser(profile, role, specialty, specialityId, doctorId),
    });
    return () => disconnectConversationSocket();
  }, [id, accessToken, profile?.id, role, specialty, specialityId, doctorId]);

  useEffect(() => {
    if (!id || !accessToken || !profile?.id) return;
    void loadMessages(id, accessToken, profile.id);
    void markRead(id, accessToken);
  }, [id, accessToken, profile?.id, loadMessages, markRead]);

  useEffect(() => {
    if (!id || !accessToken || !isDoctorPatientChat) {
      setAccessStatus(null);
      return;
    }

    let cancelled = false;
    setAccessLoading(true);
    void fetchDoctorPatientAccess(accessToken, id)
      .then((status) => {
        if (!cancelled) setAccessStatus(status);
      })
      .catch(() => {
        if (!cancelled) setAccessStatus(null);
      })
      .finally(() => {
        if (!cancelled) setAccessLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, accessToken, isDoctorPatientChat]);

  useEffect(() => {
    if (!id) return;
    onChatAccessUpdated((payload) => {
      if (payload.peer_id === id) setAccessStatus(payload.status);
    });
    return () => onChatAccessUpdated(null);
  }, [id]);

  const chatMessages = useMemo(() => [...messages].reverse(), [messages]);
  const scrolledConsultationRef = useRef<string | null>(null);
  const [highlightConsultationId, setHighlightConsultationId] = useState<string | null>(null);
  const latestAppointmentMessageIds = useMemo(() => {
    const map = new Map<string, string>();
    for (const message of messages) {
      const apptId = message.appointmentAction?.appointment_id;
      if (apptId) map.set(apptId, message.id);
    }
    return map;
  }, [messages]);
  const appointmentStatuses = useMemo(() => {
    const map = new Map<string, { status: string; meetingLink?: string | null }>();
    for (const message of messages) {
      if (message.type !== "appointment_action" || !message.appointmentAction) continue;
      map.set(message.appointmentAction.appointment_id, {
        status: message.appointmentAction.status ?? "pending",
        meetingLink: message.appointmentAction.meeting_link,
      });
    }
    return map;
  }, [messages]);
  const listInverted = chatMessages.length > 0;

  const scrollToLatest = useCallback(
    (animated = false) => {
      scrollChatToLatest(listRef, listInverted, animated);
    },
    [listInverted],
  );

  useEffect(() => {
    lastMessageTokenRef.current = "";
    stickToBottomRef.current = true;
  }, [id]);

  useEffect(() => {
    if (!id) {
      lastMessageTokenRef.current = "";
      return;
    }
    if (messagesLoading) return;

    const token =
      messages.length === 0
        ? "empty"
        : `${messages[messages.length - 1]?.id}:${messages.length}`;

    if (token === lastMessageTokenRef.current) return;

    const prevToken = lastMessageTokenRef.current;
    lastMessageTokenRef.current = token;

    if (messages.length === 0) return;

    stickToBottomRef.current = true;
    const isInitialBatch = prevToken === "" || prevToken === "empty";
    scrollToLatest(!isInitialBatch);
  }, [id, messages, messagesLoading, scrollToLatest]);

  // Deep-link from the doctor's consultation list: scroll to and highlight it.
  useEffect(() => {
    if (!consultationId || messagesLoading) return;
    if (scrolledConsultationRef.current === consultationId) return;
    const index = chatMessages.findIndex(
      (m) => m.consultationAction?.consultation_id === consultationId,
    );
    if (index < 0) return;
    scrolledConsultationRef.current = consultationId;
    stickToBottomRef.current = false;
    setHighlightConsultationId(consultationId);
    requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true });
      } catch {
        // ignore — onScrollToIndexFailed will retry
      }
    });
    const t = setTimeout(() => setHighlightConsultationId(null), 3000);
    return () => clearTimeout(t);
  }, [consultationId, messagesLoading, chatMessages]);

  if (!isSignedIn(profile, accessToken)) {
    return <Redirect href="/welcome" />;
  }

  const openPatientRecord = () => {
    if (!id || !isDoctor || peer?.role !== "patient") return;
    if (!canDoctorViewPatientRecords(accessStatus)) {
      Alert.alert(
        isRTL ? "لا يوجد صلاحية" : "No access",
        isRTL
          ? "المريض لم يمنحك صلاحية عرض السجل الطبي بعد."
          : "The patient has not granted permission to view medical records yet.",
      );
      return;
    }
    router.push({
      pathname: "/patients/[userId]",
      params: { userId: id, name: peer?.name ?? "" },
    });
  };

  const openDoctorProfile = () => {
    if (!isPatient || peer?.role !== "doctor" || !id) return;
    const entityId = peer.doctorEntityId;
    if (!entityId) {
      Alert.alert(
        isRTL ? "تعذر فتح الملف" : "Could not open profile",
        isRTL ? "بيانات الطبيب غير متوفرة." : "Doctor profile data is unavailable.",
      );
      return;
    }
    router.push({
      pathname: "/doctor/[doctorId]",
      params: { doctorId: entityId, userId: id },
    });
  };

  const closeReactionPicker = useCallback(() => {
    setReactionTarget(null);
    setReactionAnchor(null);
  }, []);

  const showReactionPicker = useCallback((item: ChatMessage) => {
    const node = messageAnchorsRef.current.get(item.id);
    const body = chatBodyRef.current;
    if (!node || !body) {
      setReactionTarget(item);
      setReactionAnchor(null);
      return;
    }

    body.measureInWindow((bodyX, bodyY) => {
      node.measureInWindow((x, y, width, height) => {
        setReactionTarget(item);
        setReactionAnchor({
          top: y - bodyY + height + 6,
          left: x - bodyX,
          width,
          mine: item.senderId === "me",
        });
      });
    });
  }, []);

  const openMessageActions = (item: ChatMessage) => {
    if (!id || !accessToken || !profile?.id || item.senderId !== "me") return;

    showChatMessageActions({
      message: item,
      isRTL,
      onEditText: () => setEditingMessage(item),
      onChangeRecord: () => void openMedicalPickerForReplace(item),
      onDelete: () => {
        void deleteMessage(id, item.id, accessToken, profile.id, role).catch(() => {
          Alert.alert(
            isRTL ? "تعذر الحذف" : "Could not delete",
            isRTL ? "حاول مرة أخرى." : "Please try again.",
          );
        });
      },
    });
  };

  const handleToggleEmotion = useCallback(
    async (message: ChatMessage, emotion: MessageEmotionType) => {
      if (!accessToken) return;
      try {
        const result = await setMessageEmotion(
          accessToken,
          message.id,
          "chat",
          emotion,
        );
        updateMessageEmotions(message.id, mapEmotionRows(result.emotions));
      } catch (e) {
        Alert.alert(
          isRTL ? "تعذر الإضافة" : "Could not react",
          e instanceof Error ? e.message : isRTL ? "حاول مرة أخرى." : "Please try again.",
        );
      } finally {
        closeReactionPicker();
      }
    },
    [accessToken, isRTL, updateMessageEmotions, closeReactionPicker],
  );

  const handleEditMessage = async (messageId: string, content: string) => {
    if (!id || !accessToken || !profile?.id) return;
    try {
      await editMessage(id, messageId, content, accessToken, profile.id, role);
      setEditingMessage(null);
    } catch (e) {
      Alert.alert(
        isRTL ? "تعذر التعديل" : "Could not edit",
        e instanceof Error ? e.message : isRTL ? "حاول مرة أخرى." : "Please try again.",
      );
    }
  };

  const handleSend = async (input: SendMessageInput, replaceTempId?: string) => {
    const abortSend = () => {
      if (replaceTempId && id) failPendingMessage(id, replaceTempId);
      throw new Error("SEND_ABORTED");
    };

    if (!id || !accessToken || !profile?.id || sending || sendingRef.current) abortSend();

    sendingRef.current = true;
    setSending(true);
    try {
      await sendMessage(id, input, accessToken, profile!.id, role, replaceTempId);
    } catch (e) {
      if (replaceTempId) failPendingMessage(id, replaceTempId);
      if ((e as Error).message !== "SEND_ABORTED") {
        Alert.alert(
          isRTL ? "خطأ" : "Error",
          e instanceof Error ? e.message : isRTL ? "تعذر إرسال الرسالة" : "Failed to send message",
        );
      }
      throw e;
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const loadMedicalRecords = async () => {
    if (!accessToken || !profile?.id) return;
    setMedicalPickerLoading(true);
    try {
      const apiRecords = await fetchAllMedicalHistory(profile.id, accessToken, role ?? undefined);
      setRecordsFromApi(apiRecords, profile.id);
    } catch {
      // keep cached records if refresh fails
    } finally {
      setMedicalPickerLoading(false);
    }
  };

  const closeMedicalPicker = () => {
    setMedicalPickerOpen(false);
    setMedicalPickerMode("share");
    setReplacingMedicalMessage(null);
  };

  const openMedicalPicker = async () => {
    if (!accessToken || !profile?.id || !isPatient) return;
    setMedicalPickerMode("share");
    setReplacingMedicalMessage(null);
    setMedicalPickerOpen(true);
    await loadMedicalRecords();
  };

  const openMedicalPickerForReplace = async (message: ChatMessage) => {
    if (!accessToken || !profile?.id || !isPatient || message.type !== "medical_link") return;
    setReplacingMedicalMessage(message);
    setMedicalPickerMode("replace");
    setMedicalPickerOpen(true);
    await loadMedicalRecords();
  };

  const handleMedicalPickerSelect = async (record: MedicalRecord, note?: string) => {
    const trimmedNote = note?.trim();
    const meta: MedicalLinkMeta = {
      record_type: record.category as MedicalLinkMeta["record_type"],
      record_id: record.id,
      title: record.title,
      ...(trimmedNote ? { note: trimmedNote } : {}),
    };

    if (replacingMedicalMessage && id && accessToken && profile?.id) {
      closeMedicalPicker();
      try {
        await editMedicalMessage(
          id,
          replacingMedicalMessage.id,
          meta,
          trimmedNote,
          record.title,
          accessToken,
          profile.id,
          role,
        );
      } catch (e) {
        Alert.alert(
          isRTL ? "تعذر التحديث" : "Could not update",
          e instanceof Error ? e.message : isRTL ? "حاول مرة أخرى." : "Please try again.",
        );
      }
      return;
    }

    closeMedicalPicker();
    await handleSend({
      recipientId: id!,
      type: "medical_link",
      content: trimmedNote || record.title,
      medicalLink: meta,
    });
  };

  const openDiagnosisModal = () => {
    if (!canUseDiagnosisTemplates) return;
    setDiagnosisModalOpen(true);
  };

  const openPrescriptionScreen = () => {
    if (!id || !canUseDiagnosisTemplates) return;
    router.push({
      pathname: "/medical/prescription/add",
      params: { patientUserId: id },
    });
  };

  const handleAccessAction = async (action: AccessActionType) => {
    if (!id || !accessToken || !profile?.id || sending) return;

    const confirmBlock =
      action === "patient_block" || action === "doctor_block"
        ? await new Promise<boolean>((resolve) => {
            Alert.alert(
              isRTL ? "تأكيد الحظر" : "Confirm block",
              isRTL
                ? "لن تتمكن من إرسال رسائل جديدة حتى يُرفع الحظر."
                : "You will not be able to send new messages until the block is lifted.",
              [
                { text: isRTL ? "إلغاء" : "Cancel", style: "cancel", onPress: () => resolve(false) },
                {
                  text: isRTL ? "حظر" : "Block",
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ],
            );
          })
        : true;

    if (!confirmBlock) return;

    setSending(true);
    try {
      await sendMessage(
        id,
        { recipientId: id, type: "access_action", accessAction: { action } },
        accessToken,
        profile.id,
        role,
      );
      const status = await fetchDoctorPatientAccess(accessToken, id);
      setAccessStatus(status);
    } catch (e) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        e instanceof Error ? e.message : isRTL ? "تعذر تنفيذ الإجراء" : "Action failed",
      );
    } finally {
      setSending(false);
    }
  };

  const handleAppointmentAction = async (
    appointmentId: string,
    action: "confirm" | "reject" | "cancel",
  ) => {
    if (!id || !accessToken || !profile?.id || appointmentActionBusy) return;

    if (action === "cancel") {
      const ok =
        Platform.OS === "web"
          ? confirm(isRTL ? "هل تريد إلغاء هذا الموعد؟" : "Cancel this appointment?")
          : await new Promise<boolean>((resolve) => {
              Alert.alert(
                isRTL ? "إلغاء الموعد" : "Cancel appointment",
                isRTL ? "هل تريد إلغاء هذا الموعد؟" : "Cancel this appointment?",
                [
                  {
                    text: isRTL ? "لا" : "No",
                    style: "cancel",
                    onPress: () => resolve(false),
                  },
                  {
                    text: isRTL ? "نعم" : "Yes",
                    style: "destructive",
                    onPress: () => resolve(true),
                  },
                ],
              );
            });
      if (!ok) return;
    }

    setAppointmentActionBusy(true);
    try {
      const row = await sendAppointmentAction(accessToken, id, {
        appointment_id: appointmentId,
        action,
        date: "",
        time: "",
      });
      const msg = mapMessageRow(row, id, profile.id);
      useChatStore.setState((s) => {
        const thread = s.messages[id] ?? [];
        if (thread.some((m) => m.id === msg.id)) return s;
        return {
          messages: { ...s.messages, [id]: [...thread, msg] },
        };
      });
    } catch (e) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        e instanceof Error ? e.message : isRTL ? "تعذر تحديث الموعد" : "Could not update appointment",
      );
    } finally {
      setAppointmentActionBusy(false);
    }
  };

  const handleIntakeExamAssigned = async (
    instance: Awaited<ReturnType<typeof import("@/domains/intake-exams/api").assignIntakeExam>>,
  ) => {
    if (!id || !accessToken || !profile?.id) return;
    const mapped = mapInstance(instance);
    const meta: MedicalLinkMeta = {
      record_type: "intake",
      record_id: mapped.id,
      title: mapped.title,
    };
    await handleSend({
      recipientId: id,
      type: "medical_link",
      content: mapped.title,
      medicalLink: meta,
    });
    notifyMedicalHistoryChanged(id);
    void fetchAllMedicalHistory(id, accessToken, role ?? undefined).then((rows) =>
      setRecordsFromApi(rows, id),
    );
  };

  const handleDiagnosisSubmit = async (
    payload: import("@/components/DiagnosisChatForm").DiagnosisSubmitPayload,
  ) => {
    if (!id || !accessToken || !profile?.id || !doctorId || !canUseDiagnosisTemplates) return;

    setSavingDiagnosis(true);
    try {
      const record = await createDiagnosis(
        {
          desc: payload.description,
          patient_id: id,
          doctor_id: doctorId,
          symptoms: payload.symptoms.map((desc) => ({ desc })),
          document_ids: payload.documentIds.length > 0 ? payload.documentIds : undefined,
          body_part: payload.bodyPart,
          prescription_id: payload.prescription_id,
          prescription: payload.prescription,
          intake_exam_assignment_id: payload.intake_exam_assignment_id,
          intake_exam: payload.intake_exam,
        },
        accessToken,
      );

      const trimmedNote = payload.note?.trim();
      const meta: MedicalLinkMeta = {
        record_type: "diagnosis",
        record_id: record.id,
        title: record.title,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      };

      await handleSend({
        recipientId: id,
        type: "medical_link",
        content: trimmedNote || record.title,
        medicalLink: meta,
      });

      setDiagnosisModalOpen(false);
    } catch (e) {
      Alert.alert(
        isRTL ? "تعذر الحفظ" : "Could not save",
        e instanceof Error ? e.message : isRTL ? "حاول مرة أخرى." : "Please try again.",
      );
    } finally {
      setSavingDiagnosis(false);
    }
  };

  const replacingMedicalNote = useMemo(() => {
    if (!replacingMedicalMessage?.medicalLink) return "";
    const title = replacingMedicalMessage.medicalLink.title?.trim() ?? "";
    return (
      replacingMedicalMessage.medicalLink.note?.trim() ||
      (replacingMedicalMessage.text?.trim() !== title
        ? replacingMedicalMessage.text?.trim()
        : "") ||
      ""
    );
  }, [replacingMedicalMessage]);

  const wrapDesktop = (node: React.ReactNode) => {
    if (!desktopLayout) return node;
    return (
      <View style={[styles.desktopPage, { backgroundColor: colors.background }]}>
        <View style={[styles.desktopContainer, { maxWidth: WEB_MAX_WIDTH.content }]}>
          <View
            style={[
              styles.chatPanel,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {node}
          </View>
        </View>
      </View>
    );
  };

  if (!contactsReady) {
    return wrapDesktop(
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>,
    );
  }

  if (!peer || !id || !accessToken) {
    return wrapDesktop(
      <View style={styles.center}>
        <Text style={{ color: colors.foreground }}>
          {isRTL ? "المحادثة غير موجودة" : "Conversation not found."}
        </Text>
      </View>,
    );
  }

  const rowDir = chatFlexRow();
  const canOpenDoctorProfile =
    ((isPatient || isDoctorDoctorChat) &&
      peer?.role === "doctor" &&
      !!peer.doctorEntityId) ||
    false;
  const onPeerHeaderPress = canOpenPatientRecord
    ? openPatientRecord
    : canOpenDoctorProfile
      ? openDoctorProfile
      : undefined;

  const headerPaddingTop = desktopLayout ? 16 : insets.top + 8;
  const composerBottomInset = desktopLayout ? 12 : insets.bottom;
  const listPadding = desktopLayout
    ? { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, gap: 8 }
    : { padding: 14, gap: 6, paddingBottom: 12 };

  const chatUi = (
    <>
      <View
        style={[
          styles.header,
          desktopLayout && styles.headerDesktop,
          {
            paddingTop: headerPaddingTop,
            backgroundColor: desktopLayout ? colors.background : colors.card,
            borderBottomColor: colors.border,
            flexDirection: rowDir,
          },
        ]}
      >
        <Pressable onPress={leaveChatToHistory} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>

        <Pressable
          onPress={onPeerHeaderPress}
          disabled={!onPeerHeaderPress}
          style={[styles.peerInfo, { flexDirection: rowDir }]}
        >
          <Avatar
            uri={peer.photoUrl}
            seed={peer.id}
            role={peer.role === "doctor" ? "doctor" : "patient"}
            size={30}
            presence={peer.presence}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.peerName,
                { color: colors.foreground, textAlign: "left" },
              ]}
            >
              {peer.name}
            </Text>
            <Text
              style={[
                styles.presence,
                {
                  color: peerTyping
                    ? colors.primary
                    : presenceTextColor(peer.presence, colors),
                  textAlign: "left",
                },
              ]}
            >
              {peerTyping
                ? isRTL
                  ? "يكتب…"
                  : "typing…"
                : formatPresenceLabel(peer, isRTL)}
              {!peerTyping && peer.specialty ? ` · ${peer.specialty}` : ""}
              {!peerTyping && canOpenDoctorProfile
                ? isRTL
                  ? " · اضغط لعرض الملف"
                  : " · tap for profile"
                : ""}
            </Text>
          </View>
        </Pressable>

        {canOpenPatientRecord ? (
          <Pressable
            onPress={openPatientRecord}
            accessibilityRole="button"
            accessibilityLabel={isRTL ? "عرض السجل" : "View Record"}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.viewRecordBtn,
              {
                borderColor: colors.primary,
                backgroundColor:
                  pressed || hovered ? `${colors.primary}14` : colors.card,
              },
            ]}
            hitSlop={8}
          >
            <View style={[styles.viewRecordBtnInner, { flexDirection: rowDir }]}>
              <FileText size={16} color={colors.primary} />
              <Text
                style={[styles.viewRecordBtnText, { color: colors.primary }]}
                numberOfLines={1}
              >
                {isRTL ? "عرض السجل" : "View Record"}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      {isDoctorPatientChat && !accessLoading ? (
        <ChatAccessBanner isRTL={isRTL} isDoctor={isDoctor} access={accessStatus} />
      ) : null}

      <KeyboardAvoidingView
        style={[styles.chatBody, desktopLayout && styles.chatBodyDesktop]}
        behavior="padding"
      >
      <View ref={chatBodyRef} style={styles.chatBodyInner} collapsable={false}>
      {messagesLoading ? (
        <View style={styles.loadingMessages}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={chatMessages}
          inverted={listInverted}
          keyExtractor={(m) => m.id}
          extraData={`${reactionTarget?.id ?? ""}:${messages.length}`}
          style={[styles.messageList, desktopLayout && { backgroundColor: colors.muted }]}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onScrollBeginDrag={closeReactionPicker}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              try {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  viewPosition: 0.5,
                  animated: true,
                });
              } catch {
                // give up silently
              }
            }, 300);
          }}
          onContentSizeChange={() => {
            if (stickToBottomRef.current) scrollToLatest(false);
          }}
          onLayout={() => {
            if (stickToBottomRef.current && messages.length > 0) scrollToLatest(false);
          }}
          contentContainerStyle={
            messages.length === 0
              ? [styles.emptyListContent, desktopLayout && styles.emptyListContentDesktop]
              : listPadding
          }
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 15,
                  textAlign: "center",
                }}
              >
                {isRTL ? "أرسل رسالتك الأولى" : "Send your first message"}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            if (item.type === "access_action" || item.type === "appointment_action") {
              const apptId = item.appointmentAction?.appointment_id;
              const showAppointmentControls = apptId
                ? latestAppointmentMessageIds.get(apptId) === item.id
                : false;
              return (
                <ChatMessageBubble
                  item={item}
                  mine={item.senderId === "me"}
                  isRTL={isRTL}
                  rowDir={rowDir}
                  patientUserId={patientUserIdForLinks}
                  canOpenMedicalLink={canOpenSharedMedicalLinks}
                  isDoctor={isDoctor}
                  appointmentStatus={apptId ? appointmentStatuses.get(apptId) : undefined}
                  showAppointmentControls={showAppointmentControls}
                  onAppointmentAction={(appointmentId, action) =>
                    void handleAppointmentAction(appointmentId, action)
                  }
                  appointmentActionBusy={appointmentActionBusy}
                />
              );
            }

            const mine = item.senderId === "me";
            const prev = chatMessages[index + 1];
            const showAvatar = !mine && (!prev || prev.senderId !== item.senderId);

            return (
              <View
                style={[
                  styles.bubbleRow,
                  {
                    flexDirection: rowDir,
                    justifyContent: mine ? "flex-end" : "flex-start",
                  },
                ]}
              >
                {!mine ? (
                  <View style={{ width: 22 }}>
                    {showAvatar ? (
                      <Avatar
                        uri={peer.photoUrl}
                        seed={peer.id}
                        role={peer.role === "doctor" ? "doctor" : "patient"}
                        size={22}
                      />
                    ) : null}
                  </View>
                ) : null}

                <View
                  ref={(node) => {
                    if (node) messageAnchorsRef.current.set(item.id, node);
                    else messageAnchorsRef.current.delete(item.id);
                  }}
                  collapsable={false}
                  style={[
                    styles.messageColumn,
                    mine ? styles.messageColumnMine : styles.messageColumnTheirs,
                  ]}
                >
                  <ChatMessageBubble
                    item={item}
                    mine={mine}
                    isRTL={isRTL}
                    rowDir={rowDir}
                    patientUserId={patientUserIdForLinks}
                    canOpenMedicalLink={canOpenSharedMedicalLinks}
                    onImagePress={setFullscreenImage}
                    onVideoPress={setFullscreenVideo}
                    selfUserId={profile?.id}
                    onLongPress={
                      canReactToMessage(item) ? () => showReactionPicker(item) : undefined
                    }
                    onEmotionToggle={(emotion) => void handleToggleEmotion(item, emotion)}
                    highlighted={
                      editingMessage?.id === item.id ||
                      replacingMedicalMessage?.id === item.id ||
                      reactionTarget?.id === item.id ||
                      (!!highlightConsultationId &&
                        item.consultationAction?.consultation_id ===
                          highlightConsultationId)
                    }
                  />
                </View>
              </View>
            );
          }}
        />
      )}

      {reactionTarget && reactionAnchor ? (
        <ChatReactionOverlay
          anchor={reactionAnchor}
          message={reactionTarget}
          selfUserId={profile?.id}
          onSelect={(emotion) => void handleToggleEmotion(reactionTarget, emotion)}
          onClose={closeReactionPicker}
          onMore={
            reactionTarget.senderId === "me"
              ? () => {
                  const target = reactionTarget;
                  closeReactionPicker();
                  openMessageActions(target);
                }
              : undefined
          }
        />
      ) : null}
      </View>

      <View style={[styles.chatFooter, desktopLayout && styles.chatFooterDesktop]}>
      {isDoctorPatientChat && !chatBlocked ? (
        <ConsultationBar
          peerId={id}
          isPatient={isPatient}
          isDoctor={isDoctor}
          enabled={isDoctorPatientChat}
          token={accessToken}
          isRTL={isRTL}
          colors={colors}
          selfId={profile!.id}
          selfRole={role ?? "patient"}
          latestAction={latestConsultationAction}
          onOpenChange={setConsultationOpen}
          onActiveChange={(c) => setActiveConsultationId(c?.id)}
        />
      ) : null}
      {/* Doctor clinical actions during an open consultation */}
      {isDoctor && canUseDiagnosisTemplates && !chatBlocked ? (
        <View
          style={[
            styles.bookPillBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              flexDirection: chatFlexRow(),
            },
          ]}
        >
          <Pressable
            onPress={openDiagnosisModal}
            accessibilityRole="button"
            accessibilityLabel={isRTL ? "إضافة تشخيص" : "Add diagnosis"}
            style={({ pressed }) => [
              styles.bookPill,
              {
                backgroundColor: pressed ? `${colors.primary}22` : `${colors.primary}12`,
                borderColor: colors.primary,
                flexDirection: chatFlexRow(),
              },
            ]}
          >
            <Stethoscope size={15} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
              {isRTL ? "تشخيص جديد" : "Add diagnosis"}
            </Text>
          </Pressable>
          <Pressable
            onPress={openPrescriptionScreen}
            accessibilityRole="button"
            accessibilityLabel={isRTL ? "إضافة روشتة" : "Add prescription"}
            style={({ pressed }) => [
              styles.bookPill,
              {
                backgroundColor: pressed ? `${colors.primary}22` : `${colors.primary}12`,
                borderColor: colors.primary,
                flexDirection: chatFlexRow(),
              },
            ]}
          >
            <Pill size={15} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
              {isRTL ? "روشتة جديدة" : "Add prescription"}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {/* Quick-action pill row — Book appointment stays available to patients at
          all times, even without a consultation. */}
      {isPatient && peer?.doctorEntityId && !chatBlocked ? (
        <View style={[styles.bookPillBar, { backgroundColor: colors.card, borderTopColor: colors.border, flexDirection: chatFlexRow() }]}>
          <Pressable
            onPress={() => setBookAppointmentOpen(true)}
            style={({ pressed }) => [
              styles.bookPill,
              {
                backgroundColor: pressed ? `${colors.primary}22` : `${colors.primary}12`,
                borderColor: colors.primary,
                flexDirection: chatFlexRow(),
              },
            ]}
          >
            <Calendar size={15} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
              {isRTL ? "حجز موعد" : "Book appointment"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <ChatComposer
        isRTL={isRTL}
        isPatient={isPatient}
        selfId={profile!.id}
        accessToken={accessToken}
        peerId={id}
        sending={sending}
        bottomInset={composerBottomInset}
        onSend={handleSend}
        onAddPending={(msg) => addPendingMessage(id, msg)}
        onFailPending={(tempId) => failPendingMessage(id, tempId)}
        onPickMedical={() => void openMedicalPicker()}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onEdit={handleEditMessage}
        disabled={chatBlocked || needsConsultation}
        disabledHint={
          needsConsultation && !chatBlocked
            ? isPatient
              ? isRTL
                ? "ابدأ استشارة لإرسال الرسائل."
                : "Start a consultation to send messages."
              : isRTL
                ? "لا يمكن المراسلة حتى يبدأ المريض استشارة."
                : "Messaging opens once the patient starts a consultation."
            : chatBlocked
            ? isDoctor && accessStatus?.blocked_by_doctor
              ? isRTL
                ? "لقد حظرت هذه المحادثة. استخدم «إلغاء الحظر» للمتابعة."
                : "You blocked this chat. Use Unblock to continue."
              : isPatient && accessStatus?.blocked_by_patient
                ? isRTL
                  ? "لقد حظرت هذه المحادثة. استخدم «إلغاء الحظر» للمتابعة."
                  : "You blocked this chat. Use Unblock to continue."
                : isRTL
                  ? "هذه المحادثة محظورة"
                  : "This chat is blocked"
            : undefined
        }
        canStoreImageInMedicalRecord={
          isPatient && isDoctorPatientChat && !chatBlocked
        }
        medicalRecordPatientUserId={profile?.id}
        onMedicalRecordCreated={() => {
          if (!accessToken || !profile?.id) return;
          void fetchAllMedicalHistory(profile.id, accessToken).then((apiRecords) =>
            setRecordsFromApi(apiRecords, profile.id),
          );
        }}
      />
      </View>
      </KeyboardAvoidingView>
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[{ flex: 1 }, chatLayoutDirection]}>{wrapDesktop(chatUi)}</View>

      {id && accessToken ? (
        <DiagnosisChatModal
          visible={diagnosisModalOpen}
          isRTL={isRTL}
          patientUserId={id}
          accessToken={accessToken}
          consultationId={activeConsultationId}
          saving={savingDiagnosis}
          onClose={() => {
            if (savingDiagnosis) return;
            setDiagnosisModalOpen(false);
          }}
          onSubmit={(payload) => void handleDiagnosisSubmit(payload)}
        />
      ) : null}

      {id && accessToken && isDoctor ? (
        <AssignIntakeExamDialog
          visible={intakeExamModalOpen}
          isRTL={isRTL}
          patientUserId={id}
          accessToken={accessToken}
          saving={assigningIntakeExam}
          onClose={() => {
            if (assigningIntakeExam) return;
            setIntakeExamModalOpen(false);
          }}
          onAssigned={(instance) => {
            setAssigningIntakeExam(true);
            void handleIntakeExamAssigned(instance).finally(() => {
              setAssigningIntakeExam(false);
              setIntakeExamModalOpen(false);
            });
          }}
        />
      ) : null}

      {accessToken ? (
        <AssistantCreateRecordDialog
          visible={createMedicalRecordOpen}
          token={accessToken}
          patientUserId={isDoctor ? id : undefined}
          onClose={() => setCreateMedicalRecordOpen(false)}
          onCreated={() => {
            setCreateMedicalRecordOpen(false);
            if (!profile?.id) return;
            void fetchAllMedicalHistory(profile.id, accessToken).then((apiRecords) =>
              setRecordsFromApi(apiRecords, profile.id),
            );
          }}
        />
      ) : null}

      <MedicalRecordPicker
        visible={medicalPickerOpen}
        records={medicalRecords}
        loading={medicalPickerLoading}
        isRTL={isRTL}
        mode={medicalPickerMode}
        initialNote={replacingMedicalNote}
        onClose={closeMedicalPicker}
        onSelect={(record, note) => void handleMedicalPickerSelect(record, note)}
      />

      {isPatient && id && accessToken && profile?.id && peer?.doctorEntityId ? (
        <BookAppointmentDialog
          visible={bookAppointmentOpen}
          isRTL={isRTL}
          token={accessToken}
          selfId={profile.id}
          doctorUserId={id}
          doctorEntityId={peer.doctorEntityId}
          videoConsultationPrice={peer.videoConsultationPrice}
          onClose={() => setBookAppointmentOpen(false)}
          onBooked={() => {
            if (accessToken && profile?.id) {
              void loadMessages(id, accessToken, profile.id);
            }
          }}
        />
      ) : null}

      <FullscreenImageViewer
        uri={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
      <FullscreenVideoViewer
        uri={fullscreenVideo}
        onClose={() => setFullscreenVideo(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  desktopPage: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 24,
  },
  desktopContainer: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    minHeight: 0,
  },
  chatPanel: {
    flex: 1,
    minHeight: 0,
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  chatBody: { flex: 1 },
  chatBodyInner: {
    flex: 1,
    position: "relative",
  },
  chatBodyDesktop: { backgroundColor: "transparent" },
  chatFooter: { flexShrink: 0 },
  bookPillBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 14,
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  bookPill: {
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  messageColumn: {
    flexShrink: 1,
    maxWidth: "82%",
  },
  messageColumnMine: {
    alignItems: "flex-end",
  },
  messageColumnTheirs: {
    alignItems: "flex-start",
  },
  messageList: { flex: 1 },
  loadingMessages: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyListContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
  emptyListContentDesktop: { paddingHorizontal: 32 },
  emptyChat: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  header: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    overflow: "visible",
  },
  headerDesktop: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  chatFooterDesktop: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
  },
  backBtn: { padding: 4 },
  peerInfo: { flex: 1, alignItems: "center", gap: 10, minWidth: 0 },
  viewRecordBtn: {
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
    maxWidth: "42%",
  },
  viewRecordBtnInner: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  viewRecordBtnText: {
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 0,
  },
  peerName: { fontSize: 16, fontWeight: "700" },
  presence: { fontSize: 12, marginTop: 1 },
  bubbleRow: {
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 6,
    width: "100%",
  },
});
