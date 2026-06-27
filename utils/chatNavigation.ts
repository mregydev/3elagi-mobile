import { router } from "expo-router";

/** Leave a normal chat thread and open the conversations history tab. */
export function leaveChatToHistory(): void {
  router.replace("/(tabs)/history");
}
