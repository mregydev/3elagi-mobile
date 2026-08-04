import { router } from "expo-router";
import { navigateBack } from "@/utils/appNavigation";

/** Leave an add-medical form — pop stack, otherwise go to records. */
export function leaveMedicalForm(
  fallback: "/(tabs)/records" | `/patients/${string}` = "/(tabs)/records",
) {
  navigateBack(router, fallback);
}
