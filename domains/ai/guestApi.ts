import { API_BASE } from "@/constants/api";

export type GuestAiChatResult = {
  content: string;
  used: number;
  remaining: number;
};

export class GuestAiLimitError extends Error {
  readonly code = "guest_limit";
  constructor(message = "Guest AI limit reached") {
    super(message);
    this.name = "GuestAiLimitError";
  }
}

export async function sendGuestAiChat(input: {
  guestId: string;
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  locale?: string;
}): Promise<GuestAiChatResult> {
  const res = await fetch(`${API_BASE}/ai/guest/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      guestId: input.guestId,
      message: input.message,
      history: input.history,
      locale: input.locale,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    content?: string;
    used?: number;
    remaining?: number;
    message?: string | string[] | { message?: string; code?: string };
    code?: string;
  };
  if (!res.ok) {
    const nested =
      data.message && typeof data.message === "object" && !Array.isArray(data.message)
        ? data.message
        : null;
    const code = data.code ?? nested?.code;
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : nested?.message ??
        (typeof data.message === "string" ? data.message : null) ??
        `Request failed (${res.status})`;
    if (code === "guest_limit" || res.status === 403) {
      throw new GuestAiLimitError(message);
    }
    throw new Error(message);
  }
  return {
    content: data.content ?? "",
    used: typeof data.used === "number" ? data.used : 0,
    remaining: typeof data.remaining === "number" ? data.remaining : 0,
  };
}
