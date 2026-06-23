import type { FlatList } from "react-native";
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

/** Scroll a chat list so the newest message is visible (supports inverted lists). */
export function scrollChatToLatest<T>(
  listRef: ChatListRef<T>,
  inverted: boolean,
  animated = false,
) {
  const list = listRef.current;
  if (!list) return;

  const scroll = () => {
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
  setTimeout(scroll, 16);
  setTimeout(scroll, 80);
  setTimeout(scroll, 180);
  setTimeout(scroll, 360);
}
