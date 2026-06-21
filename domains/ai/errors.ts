export const AI_RATE_LIMIT_CODE = "rate_limit";

export const AI_RATE_LIMIT_MESSAGE_EN =
  "You have reached your message limit. Please wait a minute and try again.";

export const AI_RATE_LIMIT_MESSAGE_AR =
  "لقد وصلت إلى الحد الأقصى للرسائل. يرجى الانتظار دقيقة ثم المحاولة مرة أخرى.";

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

  return {
    message:
      error ??
      (isRTL ? "تعذر إرسال الرسالة. حاول مرة أخرى." : "Could not send your message. Please try again."),
    isRateLimit: false,
    canRetry: true,
  };
}
