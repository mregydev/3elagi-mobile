import type { Router } from "expo-router";
import { Alert, Platform } from "react-native";

/** Tab segments guests may open without signing in. */
export const GUEST_ALLOWED_TABS = new Set(["index", "our-doctors"]);

/** Root segments guests may open (browse + auth + marketing). */
export function isGuestAllowedRoot(
  root: string | undefined,
  tabSegment?: string,
): boolean {
  if (
    root === undefined ||
    root === "welcome" ||
    root === "auth" ||
    root === "contact"
  ) {
    return true;
  }
  // Public doctor profile only — not doctor tooling routes.
  if (root === "doctor") {
    return !!tabSegment && tabSegment !== "intake-exams";
  }
  if (root === "(tabs)") {
    if (!tabSegment || tabSegment === "index") return true;
    return GUEST_ALLOWED_TABS.has(tabSegment);
  }
  return false;
}

/** Prompt guests to log in / sign up before starting a consultation. */
export function promptAuthForConsultation(
  router: Pick<Router, "push">,
  isRTL: boolean,
): void {
  const title = isRTL ? "تسجيل الدخول مطلوب" : "Sign in required";
  const message = isRTL
    ? "سجّل الدخول أو أنشئ حسابًا لبدء استشارة مع الطبيب."
    : "Please log in or create an account to start a consultation with the doctor.";

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const goLogin = window.confirm(`${title}\n\n${message}\n\nOK = Log in`);
    if (goLogin) {
      router.push("/auth/login");
      return;
    }
    return;
  }

  Alert.alert(title, message, [
    { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
    {
      text: isRTL ? "إنشاء حساب" : "Sign up",
      onPress: () => router.push("/auth/signup"),
    },
    {
      text: isRTL ? "تسجيل الدخول" : "Log in",
      onPress: () => router.push("/auth/login"),
    },
  ]);
}
