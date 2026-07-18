/**
 * The AI emits a consultation directive as a fenced ```consultation block holding
 * JSON so the chat can render an inline confirm card that starts a doctor chat.
 */
export interface ConsultationDirective {
  doctorUserId: string;
  doctorName?: string;
  price?: number;
  /** Patient reason / chief complaint shown to the doctor. */
  description?: string;
}

const CONSULTATION_FENCE = /```consultation\s*([\s\S]*?)```/i;

/** Extract the consultation directive (if any) and return the text without the block. */
export function parseConsultationDirective(content: string): {
  directive: ConsultationDirective | null;
  text: string;
} {
  const match = CONSULTATION_FENCE.exec(content);
  if (!match) {
    // Mid-stream: opening fence arrived but not the closing one yet — hide the
    // half-written block instead of showing raw JSON.
    const open = content.search(/```consultation/i);
    return {
      directive: null,
      text: open === -1 ? content : content.slice(0, open).trim(),
    };
  }

  const text = content.replace(match[0], "").trim();
  try {
    const raw = JSON.parse(match[1].trim()) as Record<string, unknown>;
    const doctorUserId = String(raw.doctorUserId ?? "").trim();
    if (!doctorUserId) return { directive: null, text };
    const priceNum = Number(raw.price);
    return {
      directive: {
        doctorUserId,
        doctorName:
          typeof raw.doctorName === "string" ? raw.doctorName : undefined,
        price: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : undefined,
        description:
          typeof raw.description === "string"
            ? raw.description.trim() || undefined
            : undefined,
      },
      text,
    };
  } catch {
    // Malformed/partial JSON (e.g. mid-stream) — drop the block, keep the text.
    return { directive: null, text };
  }
}

// ponytail: one runnable check for the parser. Run with `npx tsx utils/assistantConsultation.ts`.
if (require.main === module) {
  const ok = parseConsultationDirective(
    'Sure!\n```consultation\n{"doctorUserId":"u1","doctorName":"Dr X","price":10,"description":"Headache"}\n```',
  );
  if (ok.directive?.doctorUserId !== "u1" || ok.directive?.description !== "Headache")
    throw new Error("parse failed");
  if (ok.text !== "Sure!") throw new Error("text not stripped");
  const none = parseConsultationDirective("no block here");
  if (none.directive !== null || none.text !== "no block here")
    throw new Error("false positive");
  const partial = parseConsultationDirective("Hi\n```consultation\n{oops");
  if (partial.directive !== null) throw new Error("partial should be null");
  // eslint-disable-next-line no-console
  console.log("assistantConsultation self-check passed");
}
