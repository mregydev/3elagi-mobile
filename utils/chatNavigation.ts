import { router } from "expo-router";
import { navigateBack } from "@/utils/appNavigation";

/** Leave a chat thread — pop previous push state, else open history. */
export function leaveChatToHistory(): void {
  navigateBack(router, "/(tabs)/history");
}
