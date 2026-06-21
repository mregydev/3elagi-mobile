import { ActionSheetIOS, Alert, Platform } from "react-native";
import type { ChatMessage } from "@/domains/chat/types";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

function isOwnSentMessage(message: ChatMessage): boolean {
  if (message.senderId !== "me") return false;
  if (message.pending || message.failed) return false;
  if (message.id.startsWith("pending-")) return false;
  return true;
}

function withinEditWindow(message: ChatMessage): boolean {
  const sentAt = new Date(message.createdAt).getTime();
  if (Number.isNaN(sentAt)) return false;
  return Date.now() - sentAt <= EDIT_WINDOW_MS;
}

export function canDeleteMessage(message: ChatMessage): boolean {
  return isOwnSentMessage(message);
}

export function canEditTextMessage(message: ChatMessage): boolean {
  return isOwnSentMessage(message) && message.type === "text" && withinEditWindow(message);
}

export function canChangeMedicalRecord(message: ChatMessage): boolean {
  return (
    isOwnSentMessage(message) &&
    message.type === "medical_link" &&
    !!message.medicalLink &&
    withinEditWindow(message)
  );
}

/** @deprecated use canEditTextMessage */
export function canEditMessage(message: ChatMessage): boolean {
  return canEditTextMessage(message);
}

export function showChatMessageActions({
  message,
  isRTL,
  onEditText,
  onChangeRecord,
  onDelete,
}: {
  message: ChatMessage;
  isRTL: boolean;
  onEditText: () => void;
  onChangeRecord: () => void;
  onDelete: () => void;
}) {
  const editTextLabel = isRTL ? "تعديل" : "Edit";
  const changeRecordLabel = isRTL ? "تغيير السجل" : "Change record";
  const deleteLabel = isRTL ? "حذف" : "Delete";
  const cancelLabel = isRTL ? "إلغاء" : "Cancel";

  const canEditText = canEditTextMessage(message);
  const canChangeRecord = canChangeMedicalRecord(message);

  const confirmDelete = () => {
    Alert.alert(
      isRTL ? "حذف الرسالة؟" : "Delete message?",
      isRTL ? "لا يمكن التراجع عن هذا الإجراء." : "This cannot be undone.",
      [
        { text: cancelLabel, style: "cancel" },
        { text: deleteLabel, style: "destructive", onPress: onDelete },
      ],
    );
  };

  const primaryActions: { label: string; onPress: () => void }[] = [];
  if (canEditText) primaryActions.push({ label: editTextLabel, onPress: onEditText });
  if (canChangeRecord) primaryActions.push({ label: changeRecordLabel, onPress: onChangeRecord });

  if (Platform.OS === "ios") {
    const options = [...primaryActions.map((a) => a.label), deleteLabel, cancelLabel];
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = options.length - 2;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      (index) => {
        if (index === undefined || index === cancelButtonIndex) return;
        if (index === destructiveButtonIndex) {
          confirmDelete();
          return;
        }
        primaryActions[index]?.onPress();
      },
    );
    return;
  }

  const buttons = [
    ...primaryActions.map((a) => ({ text: a.label, onPress: a.onPress })),
    { text: deleteLabel, style: "destructive" as const, onPress: confirmDelete },
    { text: cancelLabel, style: "cancel" as const },
  ];

  Alert.alert(isRTL ? "الرسالة" : "Message", undefined, buttons);
}
