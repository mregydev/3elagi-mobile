export const BODY_PARTS = [
  "general",
  // Top — head & neck
  "head",
  "neck",
  "eyes",
  "ears",
  "throat",
  "thyroid",
  // Medium — arms, thorax, abdomen & mid-spine
  "shoulder",
  "left_arm",
  "right_arm",
  "left_hand",
  "right_hand",
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
  ],
  medium: [
    "shoulder",
    "left_arm",
    "right_arm",
    "left_hand",
    "right_hand",
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

/** Localized / free-text labels → canonical keys (AI often returns Arabic). */
const BODY_PART_ALIASES: Record<string, BodyPart> = {
  brain: "head",
  "head & brain": "head",
  "head and brain": "head",
  eye: "eyes",
  ear: "ears",
  arm: "left_arm",
  hand: "left_hand",
  leg: "left_leg",
  foot: "left_foot",
  kidneys: "kidney",
  عام: "general",
  الرأس: "head",
  الدماغ: "head",
  "الرأس والدماغ": "head",
  الرقبة: "neck",
  "الفقرات العنقية": "neck",
  "الرقبة والفقرات العنقية": "neck",
  العين: "eyes",
  العينان: "eyes",
  العيون: "eyes",
  الأذن: "ears",
  الأذنان: "ears",
  الأنف: "throat",
  الحلق: "throat",
  الفم: "throat",
  "الأنف والحلق والفم": "throat",
  "الغدة الدرقية": "thyroid",
  الكتف: "shoulder",
  "حزام الكتف": "shoulder",
  الذراع: "left_arm",
  "الذراع الأيسر": "left_arm",
  "الذراع الأيمن": "right_arm",
  اليد: "left_hand",
  "اليد اليسرى": "left_hand",
  "اليد اليمنى": "right_hand",
  الصدر: "chest",
  "القفص الصدري": "chest",
  "العمود الصدري": "thoracic_spine",
  "العمود القطني": "lumbar_spine",
  الظهر: "back",
  القلب: "heart",
  "القلب والأوعية": "heart",
  الرئة: "lungs",
  الرئتان: "lungs",
  "الرئتان والمسالك الهوائية": "lungs",
  البطن: "abdomen",
  المعدة: "stomach",
  الكبد: "liver",
  المرارة: "gallbladder",
  البنكرياس: "pancreas",
  الطحال: "spleen",
  الأمعاء: "intestines",
  الكلى: "kidney",
  الكلية: "kidney",
  الحوض: "pelvis",
  الورك: "hip",
  "مفصل الورك": "hip",
  المثانة: "bladder",
  "الأعضاء التناسلية": "reproductive",
  الساق: "left_leg",
  "الساق اليسرى": "left_leg",
  "الساق اليمنى": "right_leg",
  القدم: "left_foot",
  "القدم اليسرى": "left_foot",
  "القدم اليمنى": "right_foot",
};

export function parseBodyPart(value: unknown): BodyPart | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") return undefined;
  const raw = value.trim();
  if (!raw) return undefined;

  const snake = raw.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (isBodyPart(snake)) return snake;

  const compact = raw.toLowerCase().replace(/\s+/g, " ").trim();
  const direct =
    BODY_PART_ALIASES[compact] ??
    BODY_PART_ALIASES[raw] ??
    BODY_PART_ALIASES[snake.replace(/_/g, " ")];
  if (direct) return direct;

  // Prefer longest alias so "اليد اليمنى" does not match "اليد" → left_hand.
  let best: { part: BodyPart; len: number } | undefined;
  for (const [alias, part] of Object.entries(BODY_PART_ALIASES)) {
    if (alias.length < 3) continue;
    if (compact.includes(alias) || raw.includes(alias)) {
      if (!best || alias.length > best.len) best = { part, len: alias.length };
    }
  }
  return best?.part;
}

export function zoneForBodyPart(part: BodyPart): BodyZone | null {
  if (part === "general") return null;
  for (const zone of BODY_ZONES) {
    if ((BODY_PARTS_BY_ZONE[zone] as readonly string[]).includes(part)) return zone;
  }
  return null;
}
