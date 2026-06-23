export const AI_RATE_LIMIT_CODE = "rate_limit";
export const AI_INSUFFICIENT_POINTS_CODE = "insufficient_points";

export const AI_RATE_LIMIT_MESSAGE_EN =
  "You have reached your message limit. Please wait a minute and try again.";

export const AI_RATE_LIMIT_MESSAGE_AR =
  "لقد وصلت إلى الحد الأقصى للرسائل. يرجى الانتظار دقيقة ثم المحاولة مرة أخرى.";

export const AI_INSUFFICIENT_POINTS_MESSAGE_EN =
  "You do not have enough points to message the AI assistant. Add points from the Points tab.";

export const AI_INSUFFICIENT_POINTS_MESSAGE_AR =
  "ليس لديك نقاط كافية لمراسلة المساعد الذكي. أضف نقاطًا من تبويب النقاط.";

export function isAiRateLimitError(
  error?: string | null,
  code?: string | null,
): boolean {
  if (code === AI_RATE_LIMIT_CODE) return true;
  const lower = (error ?? "").toLowerCase();
  return (
    lower.includes("too many ai") ||
    lower.includes("message limit") ||
    lower.includes("rate limit")
  );
}

export function isAiInsufficientPointsError(
  error?: string | null,
  code?: string | null,
): boolean {
  if (code === AI_INSUFFICIENT_POINTS_CODE) return true;
  const lower = (error ?? "").toLowerCase();
  return lower.includes("insufficient message points") || lower.includes("insufficient points");
}

export function formatAiChatError(
  error: string | undefined,
  code: string | undefined,
  isRTL: boolean,
): { message: string; isRateLimit: boolean; canRetry: boolean } {
  if (isAiRateLimitError(error, code)) {
    return {
      message: isRTL ? AI_RATE_LIMIT_MESSAGE_AR : AI_RATE_LIMIT_MESSAGE_EN,
      isRateLimit: true,
      canRetry: false,
    };
  }

  if (isAiInsufficientPointsError(error, code)) {
    return {
      message: isRTL ? AI_INSUFFICIENT_POINTS_MESSAGE_AR : AI_INSUFFICIENT_POINTS_MESSAGE_EN,
      isRateLimit: false,
      canRetry: false,
    };
  }

  return {
    message:
      error ??
      (isRTL ? "تعذر إرسال الرسالة. حاول مرة أخرى." : "Could not send your message. Please try again."),
    isRateLimit: false,
    canRetry: true,
  };
}
