export const BODY_PARTS = [
  "general",
  "head",
  "neck",
  "chest",
  "abdomen",
  "back",
  "pelvis",
  "left_arm",
  "right_arm",
  "left_hand",
  "right_hand",
  "left_leg",
  "right_leg",
  "left_foot",
  "right_foot",
] as const;

export type BodyPart = (typeof BODY_PARTS)[number];

/** Skeleton diagram regions (excludes general — shown as a chip). */
export const SKELETON_BODY_PARTS = BODY_PARTS.filter(
  (p): p is Exclude<BodyPart, "general"> => p !== "general",
);

export function isBodyPart(value: unknown): value is BodyPart {
  return typeof value === "string" && (BODY_PARTS as readonly string[]).includes(value);
}

export function parseBodyPart(value: unknown): BodyPart | undefined {
  return isBodyPart(value) ? value : undefined;
}
