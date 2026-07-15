import type { BodyPart } from "@/domains/medical/bodyParts";
import type { MedicalCategory } from "@/domains/medical/types";

/** Build medical add / prescription routes with optional category, owner + body part. */
export function buildMedicalAddHref(
  category?: MedicalCategory | null,
  options?: { patientUserId?: string | null; bodyPart?: BodyPart | null },
): string {
  const owner = options?.patientUserId?.trim();
  const bodyPart = options?.bodyPart;

  if (category === "prescription") {
    const params = new URLSearchParams();
    if (owner) params.set("patientUserId", owner);
    if (bodyPart) params.set("bodyPart", bodyPart);
    const qs = params.toString();
    return qs ? `/medical/prescription/add?${qs}` : "/medical/prescription/add";
  }

  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (owner) params.set("patientUserId", owner);
  if (bodyPart) params.set("bodyPart", bodyPart);
  const qs = params.toString();
  return qs ? `/medical/add?${qs}` : "/medical/add";
}
