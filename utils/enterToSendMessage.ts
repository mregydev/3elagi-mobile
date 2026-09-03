import type { NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
import { Platform } from "react-native";

/** Enter sends; Shift+Enter inserts a newline (web). */
export function handleEnterToSendMessage(
  e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  send: () => void,
): void {
  if (e.nativeEvent.key !== "Enter") return;

  const native = e.nativeEvent as TextInputKeyPressEventData & {
    shiftKey?: boolean;
  };
  if (native.shiftKey) return;

  if (Platform.OS === "web") {
    e.preventDefault?.();
  }

  send();
}
