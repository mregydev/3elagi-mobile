import type { ImageSourcePropType } from "react-native";

/** Bundled expressive speciality tiles — always load offline. */
export const SPECIALITY_IMAGE_SOURCES: Record<string, ImageSourcePropType> = {
  "General Medicine": require("@/assets/specialities/general-medicine.png"),
  Cardiology: require("@/assets/specialities/cardiology.png"),
  Dermatology: require("@/assets/specialities/dermatology.png"),
  Pediatrics: require("@/assets/specialities/pediatrics.png"),
  Orthopedics: require("@/assets/specialities/orthopedics.png"),
  Neurology: require("@/assets/specialities/neurology.png"),
  Ophthalmology: require("@/assets/specialities/ophthalmology.png"),
  Dentistry: require("@/assets/specialities/dentistry.png"),
  Surgery: require("@/assets/specialities/orthopedics.png"),
};

export function resolveSpecialityImageSource(
  nameEn: string,
): ImageSourcePropType | null {
  return SPECIALITY_IMAGE_SOURCES[nameEn] ?? null;
}
