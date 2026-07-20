import type { FlatList, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Platform } from "react-native";

type ChatListRef<T> = React.RefObject<FlatList<T> | null>;

function getWebScrollNode<T>(list: FlatList<T>): HTMLElement | null {
  const candidate = list as unknown as {
    getScrollableNode?: () => HTMLElement;
    getNativeScrollRef?: () => { getScrollableNode?: () => HTMLElement };
  };
  return (
    candidate.getScrollableNode?.() ??
    candidate.getNativeScrollRef?.()?.getScrollableNode?.() ??
    null
  );
}

/** Distance from the latest edge where we still treat the list as "stuck" to new messages. */
export const CHAT_STICK_THRESHOLD_PX = 72;

/** For inverted lists, offset ~0 is the latest edge. */
export function isChatStuckToLatest(
  event: NativeSyntheticEvent<NativeScrollEvent>,
  inverted: boolean,
  threshold = CHAT_STICK_THRESHOLD_PX,
): boolean {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  if (inverted) {
    return contentOffset.y <= threshold;
  }
  const distanceFromEnd =
    contentSize.height - layoutMeasurement.height - contentOffset.y;
  return distanceFromEnd <= threshold;
}

/** Scroll a chat list so the newest message is visible (supports inverted lists). */
export function scrollChatToLatest<T>(
  listRef: ChatListRef<T>,
  inverted: boolean,
  animated = false,
  options?: { shouldContinue?: () => boolean },
) {
  const list = listRef.current;
  if (!list) return;

  const shouldContinue = options?.shouldContinue ?? (() => true);

  const scroll = () => {
    if (!shouldContinue()) return;
    try {
      if (inverted) {
        list.scrollToOffset({ offset: 0, animated });
      } else {
        list.scrollToEnd({ animated });
      }
    } catch {
      // List may not be laid out yet.
    }

    if (Platform.OS === "web") {
      const node = getWebScrollNode(list);
      if (!node) return;
      if (inverted) {
        node.scrollTop = 0;
      } else {
        node.scrollTop = node.scrollHeight;
      }
    }
  };

  requestAnimationFrame(scroll);
  // Short retries only — long delayed jumps fight the user while they scroll up.
  setTimeout(scroll, 16);
  setTimeout(scroll, 80);
  setTimeout(scroll, 200);
}
