import { router } from "expo-router";

/** Leave an add-medical form — back when possible, otherwise go to records. */
export function leaveMedicalForm(fallback: "/(tabs)/records" | `/patients/${string}` = "/(tabs)/records") {
  if (typeof router.canGoBack === "function" && router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback as never);
}
