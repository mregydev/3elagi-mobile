/** ISO 3166-1 alpha-2 — keep in sync with API PATIENT_COUNTRY_CODES. */
export const PATIENT_COUNTRY_CODES = [
  "EG",
  "SA",
  "AE",
  "JO",
  "KW",
  "QA",
  "BH",
  "OM",
  "LB",
  "IQ",
  "LY",
  "SD",
  "MA",
  "TN",
  "DZ",
  "TR",
  "DE",
  "GB",
  "US",
  "FR",
  "IT",
  "ES",
] as const;

export type PatientCountryCode = (typeof PATIENT_COUNTRY_CODES)[number];

export const DEFAULT_PATIENT_COUNTRY: PatientCountryCode = "EG";

export const PATIENT_COUNTRY_LABELS: Record<
  PatientCountryCode,
  { en: string; ar: string }
> = {
  EG: { en: "Egypt", ar: "مصر" },
  SA: { en: "Saudi Arabia", ar: "السعودية" },
  AE: { en: "United Arab Emirates", ar: "الإمارات" },
  JO: { en: "Jordan", ar: "الأردن" },
  KW: { en: "Kuwait", ar: "الكويت" },
  QA: { en: "Qatar", ar: "قطر" },
  BH: { en: "Bahrain", ar: "البحرين" },
  OM: { en: "Oman", ar: "عُمان" },
  LB: { en: "Lebanon", ar: "لبنان" },
  IQ: { en: "Iraq", ar: "العراق" },
  LY: { en: "Libya", ar: "ليبيا" },
  SD: { en: "Sudan", ar: "السودان" },
  MA: { en: "Morocco", ar: "المغرب" },
  TN: { en: "Tunisia", ar: "تونس" },
  DZ: { en: "Algeria", ar: "الجزائر" },
  TR: { en: "Turkey", ar: "تركيا" },
  DE: { en: "Germany", ar: "ألمانيا" },
  GB: { en: "United Kingdom", ar: "المملكة المتحدة" },
  US: { en: "United States", ar: "الولايات المتحدة" },
  FR: { en: "France", ar: "فرنسا" },
  IT: { en: "Italy", ar: "إيطاليا" },
  ES: { en: "Spain", ar: "إسبانيا" },
};

export function patientCountryLabel(
  code: string | null | undefined,
  preferArabic: boolean,
): string {
  const key = (code?.trim().toUpperCase() || DEFAULT_PATIENT_COUNTRY) as PatientCountryCode;
  const row = PATIENT_COUNTRY_LABELS[key] ?? PATIENT_COUNTRY_LABELS.EG;
  return preferArabic ? row.ar : row.en;
}

export function isPatientCountryCode(value: string): value is PatientCountryCode {
  return (PATIENT_COUNTRY_CODES as readonly string[]).includes(value.trim().toUpperCase());
}
