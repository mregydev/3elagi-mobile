import type { BodyPart } from "@/domains/medical/bodyParts";
import type { MedicalCategory } from "@/domains/medical/types";

/** Build medical add / prescription routes with optional owner + body part. */
export function buildMedicalAddHref(
  category: MedicalCategory,
  options?: { patientUserId?: string | null; bodyPart?: BodyPart | null },
): string {
  const params = new URLSearchParams();
  const owner = options?.patientUserId?.trim();
  if (owner) params.set("patientUserId", owner);
  if (options?.bodyPart) params.set("bodyPart", options.bodyPart);

  const qs = params.toString();
  if (category === "prescription") {
    return qs ? `/medical/prescription/add?${qs}` : "/medical/prescription/add";
  }
  params.set("category", category);
  // category must be first for readability — rebuild
  const final = new URLSearchParams();
  final.set("category", category);
  if (owner) final.set("patientUserId", owner);
  if (options?.bodyPart) final.set("bodyPart", options.bodyPart);
  return `/medical/add?${final.toString()}`;
}
