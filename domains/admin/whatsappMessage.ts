import { REGISTER_URL } from "@/domains/admin/marketingSections";

export function buildDefaultWhatsAppInviteMessage(
  doctorName: string,
  senderName: string,
): string {
  const doctor = doctorName.trim() || "الدكتور";
  const sender = senderName.trim() || "فريق 3elagi";

  return [
    `مرحباً دكتور ${doctor}،`,
    "",
    `معك *${sender}*.`,
    "",
    "أدعوك للانضمام إلى *3elagi* — منصة طبية عن بُعد للمرضى من منطقة الخليج والشرق الأوسط.",
    "",
    `🌐 *سجّل معنا:* ${REGISTER_URL}`,
    "",
    "نحن في *المرحلة الأولية* من الإطلاق، وندعوك للانضمام مبكراً. *الانضمام المبكر* يمنحك مزايا عديدة.",
    "",
    "نتطلع للتعاون معك!",
  ].join("\n");
}

/** Digits only — wa.me expects country code without + or leading zeros. */
export function normalizeWhatsAppPhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidWhatsAppPhone(digits: string): boolean {
  return digits.length >= 8 && digits.length <= 15;
}

export function buildWhatsAppUrl(phoneDigits: string, message: string): string {
  const encoded = encodeURIComponent(message.trim());
  return `https://wa.me/${phoneDigits}?text=${encoded}`;
}

export type WhatsAppFormattedSegment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
  mono?: boolean;
};

/** Parse WhatsApp-style formatting for preview (*bold*, _italic_, ~strike~, ```mono```). */
export function parseWhatsAppFormatting(text: string): WhatsAppFormattedSegment[] {
  const segments: WhatsAppFormattedSegment[] = [];
  const pattern = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|```[^`\n]+```)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pushPlain = (value: string) => {
    if (value) segments.push({ text: value });
  };

  while ((match = pattern.exec(text)) !== null) {
    pushPlain(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith("*") && token.endsWith("*")) {
      segments.push({ text: token.slice(1, -1), bold: true });
    } else if (token.startsWith("_") && token.endsWith("_")) {
      segments.push({ text: token.slice(1, -1), italic: true });
    } else if (token.startsWith("~") && token.endsWith("~")) {
      segments.push({ text: token.slice(1, -1), strike: true });
    } else if (token.startsWith("```") && token.endsWith("```")) {
      segments.push({ text: token.slice(3, -3), mono: true });
    } else {
      pushPlain(token);
    }
    lastIndex = match.index + token.length;
  }

  pushPlain(text.slice(lastIndex));
  return segments.length ? segments : [{ text }];
}

export function wrapTextSelection(
  text: string,
  selection: { start: number; end: number },
  wrapper: [string, string],
  placeholder = "نص",
): { next: string; selectionStart: number; selectionEnd: number } {
  const start = Math.max(0, Math.min(selection.start, text.length));
  const end = Math.max(start, Math.min(selection.end, text.length));
  const selected = text.slice(start, end) || placeholder;
  const [open, close] = wrapper;
  const wrapped = `${open}${selected}${close}`;
  const next = text.slice(0, start) + wrapped + text.slice(end);
  const cursorStart = start + open.length;
  const cursorEnd = cursorStart + selected.length;
  return { next, selectionStart: cursorStart, selectionEnd: cursorEnd };
}
