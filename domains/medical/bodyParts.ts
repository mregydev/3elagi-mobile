export const BODY_PARTS = [
  "general",
  // Top — head, neck & upper extremities
  "head",
  "neck",
  "eyes",
  "ears",
  "throat",
  "thyroid",
  "shoulder",
  "left_arm",
  "right_arm",
  "left_hand",
  "right_hand",
  // Medium — thorax, abdomen & mid-spine
  "chest",
  "thoracic_spine",
  "lumbar_spine",
  "back",
  "heart",
  "lungs",
  "abdomen",
  "stomach",
  "liver",
  "gallbladder",
  "pancreas",
  "spleen",
  "intestines",
  "kidney",
  // Bottom — pelvis & lower extremities
  "pelvis",
  "hip",
  "bladder",
  "reproductive",
  "left_leg",
  "right_leg",
  "left_foot",
  "right_foot",
] as const;

export type BodyPart = (typeof BODY_PARTS)[number];

export const BODY_ZONES = ["top", "medium", "bottom"] as const;
export type BodyZone = (typeof BODY_ZONES)[number];

/** Parts shown when a skeleton zone is opened (excludes `general`). */
export const BODY_PARTS_BY_ZONE: Record<BodyZone, readonly Exclude<BodyPart, "general">[]> = {
  top: [
    "head",
    "neck",
    "eyes",
    "ears",
    "throat",
    "thyroid",
    "shoulder",
    "left_arm",
    "right_arm",
    "left_hand",
    "right_hand",
  ],
  medium: [
    "chest",
    "thoracic_spine",
    "lumbar_spine",
    "back",
    "heart",
    "lungs",
    "abdomen",
    "stomach",
    "liver",
    "gallbladder",
    "pancreas",
    "spleen",
    "intestines",
    "kidney",
  ],
  bottom: [
    "pelvis",
    "hip",
    "bladder",
    "reproductive",
    "left_leg",
    "right_leg",
    "left_foot",
    "right_foot",
  ],
};

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

export function zoneForBodyPart(part: BodyPart): BodyZone | null {
  if (part === "general") return null;
  for (const zone of BODY_ZONES) {
    if ((BODY_PARTS_BY_ZONE[zone] as readonly string[]).includes(part)) return zone;
  }
  return null;
}
