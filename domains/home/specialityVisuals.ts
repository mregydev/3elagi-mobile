import {
  Baby,
  Bone,
  Brain,
  Eye,
  Heart,
  type LucideIcon,
  Scissors,
  Smile,
  Sparkles,
  Stethoscope,
} from "lucide-react-native";

interface SpecialityVisual {
  icon: LucideIcon;
  color: string;
}

/** Icon + brand color per speciality — no image files, crisp at any size. */
const SPECIALITY_VISUALS: Record<string, SpecialityVisual> = {
  "General Medicine": { icon: Stethoscope, color: "#3057F2" },
  Cardiology: { icon: Heart, color: "#dc2626" },
  Dermatology: { icon: Sparkles, color: "#0284c7" },
  Pediatrics: { icon: Baby, color: "#f59e0b" },
  Orthopedics: { icon: Bone, color: "#4f46e5" },
  Neurology: { icon: Brain, color: "#7c3aed" },
  Ophthalmology: { icon: Eye, color: "#0891b2" },
  Dentistry: { icon: Smile, color: "#0d9488" },
  Surgery: { icon: Scissors, color: "#be123c" },
};

const FALLBACK: SpecialityVisual = { icon: Stethoscope, color: "#3057F2" };

export function specialityVisual(nameEn: string): SpecialityVisual {
  return SPECIALITY_VISUALS[nameEn] ?? FALLBACK;
}

/** Shift a #rrggbb hex by amt (−255..255) per channel. */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 0xff) + amt);
  const b = clamp((n & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Light→base diagonal gradient for the icon orb. */
export function specialityGradient(color: string): readonly [string, string] {
  return [shade(color, 42), color];
}
