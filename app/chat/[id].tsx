import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, FileText } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { ChatAccessBanner } from "@/components/ChatAccessBanner";
import { ChatAccessTemplates } from "@/components/ChatAccessTemplates";
import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { DiagnosisChatModal } from "@/components/DiagnosisChatModal";
import { FullscreenImageViewer } from "@/components/FullscreenImageViewer";
import { MedicalRecordPicker } from "@/components/MedicalRecordPicker";
import { PointsLowBanner } from "@/components/PointsLowBanner";
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
  canDoctorViewPatientRecords,
  fetchDoctorPatientAccess,
  type AccessActionType,
  type DoctorPatientAccessStatus,
} from "@/domains/chat/access";
import type { ChatMessage, MedicalLinkMeta, SendMessageInput } from "@/domains/chat/types";
import { onChatAccessUpdated } from "@/domains/presence/socket";
import type { MedicalRecord } from "@/domains/medical/types";
import { createDiagnosis, fetchAllMedicalHistory } from "@/domains/medical/api";
import { useMedicalStore } from "@/domains/medical/store";
import { selectPointsBalance, usePointsStore } from "@/domains/points/store";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { setMessageEmotion } from "@/domains/emotions/api";
import { mapEmotionRows, type MessageEmotionType } from "@/domains/emotions/types";
import { showChatMessageActions } from "@/utils/chatMessageActions";
import { chatFlexRow, chatLayoutDirection } from "@/utils/rtl";

const EMPTY_MESSAGES: ChatMessage[] = [];

function canReactToMessage(message: ChatMessage): boolean {
  return !message.pending && !message.failed && !message.id.startsWith("pending-");
}

function isBillableMessage(input: SendMessageInput | string): boolean {
  if (typeof input === "string") return true;
  return input.type !== "access_action";
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const messages = useChatStore((s) => s.messages[id] ?? EMPTY_MESSAGES);
  const messagesLoading = useChatStore((s) => s.messagesLoading[id] ?? false);
  const conversations = useChatStore((s) => s.conversations);
  const loadMessages = useChatStore((s) => s.loadMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const markRead = useChatStore((s) => s.markRead);
  const resolvePeer = useChatStore((s) => s.resolvePeer);
  const ensureContacts = useChatStore((s) => s.ensureContacts);
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
  const medicalRecords = useMedicalStore((s) => s.records);
  const setRecordsFromApi = useMedicalStore((s) => s.setRecordsFromApi);
  const [contactsReady, setContactsReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [medicalPickerOpen, setMedicalPickerOpen] = useState(false);
  const [medicalPickerLoading, setMedicalPickerLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [replacingMedicalMessage, setReplacingMedicalMessage] = useState<ChatMessage | null>(null);
  const [medicalPickerMode, setMedicalPickerMode] = useState<"share" | "replace">("share");
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<ChatMessage | null>(null);
  const [reactionAnchor, setReactionAnchor] = useState<ReactionAnchor | null>(null);
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [accessStatus, setAccessStatus] = useState<DoctorPatientAccessStatus | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const chatBodyRef = useRef<View>(null);
  const messageAnchorsRef = useRef<Map<string, View>>(new Map());
  const initialScrollDoneRef = useRef<string | null>(null);
  const onlineUsers = usePresenceStore((s) => s.users);
  const pointsSummary = usePointsStore((s) => s.summary);
  const pointsBalance = selectPointsBalance(pointsSummary);

  const peer = useMemo(() => {
    if (!id) return undefined;
    const resolved = resolvePeer(id);
    return resolved ? applyLivePresence(resolved) : undefined;
  }, [id, resolvePeer, conversations, contactsReady, onlineUsers]);

  const isDoctor = role?.toLowerCase() === "doctor";
  const isPatient = role?.toLowerCase() === "patient";
  const canOpenPatientRecord =
    isDoctor &&
    peer?.role === "patient" &&
    canDoctorViewPatientRecords(accessStatus);
  const isDoctorPatientChat =
    (isDoctor && peer?.role === "patient") || (isPatient && peer?.role === "doctor");
  const isDoctorDoctorChat = isDoctor && peer?.role === "doctor";
  const canUseDiagnosisTemplates = canOpenPatientRecord;
  const chatBlocked = !!accessStatus?.is_blocked;
  const messageCost = peer?.role === "doctor" ? (peer.messagePrice ?? 1) : 1;
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

  useEffect(() => {
    if (!accessToken || !id) return;
    void ensureContacts(accessToken).finally(() => setContactsReady(true));
  }, [accessToken, id, ensureContacts]);

  useEffect(() => {
    if (!id) return;
    setActiveChatPeerId(id);
    return () => {
      setActiveChatPeerId(null);
      setPeerTyping(id, false);
    };
  }, [id, setActiveChatPeerId, setPeerTyping]);

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

  const scrollToBottom = useCallback((animated = true) => {
    if (!listRef.current || messages.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, [messages.length]);

  useEffect(() => {
    if (!id) {
      initialScrollDoneRef.current = null;
      return;
    }
    if (messagesLoading || messages.length === 0) return;
    if (initialScrollDoneRef.current === id) return;

    initialScrollDoneRef.current = id;
    scrollToBottom(false);
    const timers = [
      setTimeout(() => scrollToBottom(false), 50),
      setTimeout(() => scrollToBottom(false), 200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [id, messagesLoading, messages.length, scrollToBottom]);

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

  const confirmLowBalanceSend = (balance: number, cost: number): Promise<boolean> => {
    if (balance >= 10) return Promise.resolve(true);
    return new Promise((resolve) => {
      Alert.alert(
        isRTL ? "رصيد منخفض" : "Low balance",
        isRTL
          ? `لديك ${balance} نقطة فقط. كل رسالة تستهلك ${cost} نقطة. هل تريد الإرسال؟`
          : `You have only ${balance} points left. Each message costs ${cost} point${cost === 1 ? "" : "s"}. Continue sending?`,
        [
          { text: isRTL ? "إلغاء" : "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: isRTL ? "إرسال" : "Send", onPress: () => resolve(true) },
        ],
      );
    });
  };

  const handleSend = async (input: SendMessageInput, replaceTempId?: string) => {
    if (!id || !accessToken || !profile?.id || sending) return;

    if (isBillableMessage(input)) {
      if (pointsBalance < messageCost) {
        Alert.alert(
          isRTL ? "لا توجد نقاط" : "No points",
          isRTL
            ? "ليس لديك نقاط كافية لإرسال رسالة. أضف نقاطًا من تبويب النقاط."
            : "You do not have enough points to send a message. Add points from the Points tab.",
          [
            { text: isRTL ? "حسنًا" : "OK" },
            {
              text: isRTL ? "إضافة نقاط" : "Add points",
              onPress: () => router.push("/(tabs)/points"),
            },
          ],
        );
        if (replaceTempId) failPendingMessage(id, replaceTempId);
        return;
      }

      const proceed = await confirmLowBalanceSend(pointsBalance, messageCost);
      if (!proceed) {
        if (replaceTempId) failPendingMessage(id, replaceTempId);
        return;
      }
    }

    setSending(true);
    try {
      await sendMessage(id, input, accessToken, profile.id, role, replaceTempId);
    } catch (e) {
      if (replaceTempId) failPendingMessage(id, replaceTempId);
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        e instanceof Error ? e.message : isRTL ? "تعذر إرسال الرسالة" : "Failed to send message",
      );
    } finally {
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

  const handleDiagnosisSubmit = async (payload: {
    description: string;
    symptoms: string[];
    documentIds: string[];
    note?: string;
  }) => {
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
    ? { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, gap: 8, flexGrow: 1 }
    : { padding: 14, gap: 6, paddingBottom: 12, flexGrow: 1 };

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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
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
              {!peerTyping && peer.role === "doctor" && messageCost > 0
                ? isRTL
                  ? ` · ${messageCost} نقطة/رسالة`
                  : ` · ${messageCost} pt/msg`
                : ""}
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

      {!chatBlocked ? (
        <PointsLowBanner isRTL={isRTL} balance={pointsBalance} messageCost={messageCost} />
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
          data={messages}
          keyExtractor={(m) => m.id}
          extraData={reactionTarget?.id}
          style={[styles.messageList, desktopLayout && { backgroundColor: colors.muted }]}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onScrollBeginDrag={closeReactionPicker}
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
            if (item.type === "access_action") {
              return (
                <ChatMessageBubble
                  item={item}
                  mine={item.senderId === "me"}
                  isRTL={isRTL}
                  rowDir={rowDir}
                  patientUserId={patientUserIdForLinks}
                  canOpenMedicalLink={canOpenSharedMedicalLinks}
                />
              );
            }

            const mine = item.senderId === "me";
            const prev = messages[index - 1];
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
                    selfUserId={profile?.id}
                    onLongPress={
                      canReactToMessage(item) ? () => showReactionPicker(item) : undefined
                    }
                    onEmotionToggle={(emotion) => void handleToggleEmotion(item, emotion)}
                    highlighted={
                      editingMessage?.id === item.id ||
                      replacingMedicalMessage?.id === item.id ||
                      reactionTarget?.id === item.id
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
      {isDoctorPatientChat && !editingMessage && !replacingMedicalMessage ? (
        <ChatAccessTemplates
          isRTL={isRTL}
          isDoctor={isDoctor}
          access={accessStatus}
          showDiagnosis={canOpenPatientRecord}
          onAccessAction={(action) => void handleAccessAction(action)}
          onDiagnosisPress={openDiagnosisModal}
        />
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
        disabled={chatBlocked || pointsBalance < messageCost}
        disabledHint={
          chatBlocked
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
            : pointsBalance < messageCost
              ? isRTL
                ? `تحتاج ${messageCost} نقطة لإرسال رسالة. أضف نقاطًا من تبويب النقاط.`
                : `You need ${messageCost} point${messageCost === 1 ? "" : "s"} to send a message. Add credits from the Points tab.`
              : undefined
        }
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
          saving={savingDiagnosis}
          onClose={() => {
            if (savingDiagnosis) return;
            setDiagnosisModalOpen(false);
          }}
          onSubmit={(payload) => void handleDiagnosisSubmit(payload)}
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

      <FullscreenImageViewer
        uri={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
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
