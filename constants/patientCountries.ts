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

/** Latin America (Spanish/Portuguese-speaking Americas + common regional set). */
export const LATIN_AMERICA_COUNTRY_CODES = [
  "MX", // Mexico
  "GT", // Guatemala
  "BZ", // Belize
  "HN", // Honduras
  "SV", // El Salvador
  "NI", // Nicaragua
  "CR", // Costa Rica
  "PA", // Panama
  "CU", // Cuba
  "DO", // Dominican Republic
  "HT", // Haiti
  "PR", // Puerto Rico
  "CO", // Colombia
  "VE", // Venezuela
  "GY", // Guyana
  "SR", // Suriname
  "EC", // Ecuador
  "PE", // Peru
  "BR", // Brazil
  "BO", // Bolivia
  "PY", // Paraguay
  "CL", // Chile
  "AR", // Argentina
  "UY", // Uruguay
] as const;

/**
 * Countries shown in the doctor-list filter dropdown:
 * Egypt, Jordan, and all Latin America countries.
 */
export const DOCTOR_FILTER_COUNTRY_CODES = [
  "EG",
  "JO",
  ...LATIN_AMERICA_COUNTRY_CODES,
] as const;

export type DoctorFilterCountryCode = (typeof DOCTOR_FILTER_COUNTRY_CODES)[number];

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

const LATIN_AMERICA_COUNTRY_LABELS: Record<
  (typeof LATIN_AMERICA_COUNTRY_CODES)[number],
  { en: string; ar: string }
> = {
  MX: { en: "Mexico", ar: "المكسيك" },
  GT: { en: "Guatemala", ar: "غواتيمالا" },
  BZ: { en: "Belize", ar: "بليز" },
  HN: { en: "Honduras", ar: "هندوراس" },
  SV: { en: "El Salvador", ar: "السلفادور" },
  NI: { en: "Nicaragua", ar: "نيكاراغوا" },
  CR: { en: "Costa Rica", ar: "كوستاريكا" },
  PA: { en: "Panama", ar: "بنما" },
  CU: { en: "Cuba", ar: "كوبا" },
  DO: { en: "Dominican Republic", ar: "جمهورية الدومينيكان" },
  HT: { en: "Haiti", ar: "هايتي" },
  PR: { en: "Puerto Rico", ar: "بورتوريكو" },
  CO: { en: "Colombia", ar: "كولومبيا" },
  VE: { en: "Venezuela", ar: "فنزويلا" },
  GY: { en: "Guyana", ar: "غيانا" },
  SR: { en: "Suriname", ar: "سورينام" },
  EC: { en: "Ecuador", ar: "الإكوادور" },
  PE: { en: "Peru", ar: "بيرو" },
  BR: { en: "Brazil", ar: "البرازيل" },
  BO: { en: "Bolivia", ar: "بوليفيا" },
  PY: { en: "Paraguay", ar: "باراغواي" },
  CL: { en: "Chile", ar: "تشيلي" },
  AR: { en: "Argentina", ar: "الأرجنتين" },
  UY: { en: "Uruguay", ar: "أوروغواي" },
};

const ALL_COUNTRY_LABELS: Record<string, { en: string; ar: string }> = {
  ...PATIENT_COUNTRY_LABELS,
  ...LATIN_AMERICA_COUNTRY_LABELS,
};

export function patientCountryLabel(
  code: string | null | undefined,
  preferArabic: boolean,
): string {
  const key = (code?.trim().toUpperCase() || DEFAULT_PATIENT_COUNTRY);
  const row = ALL_COUNTRY_LABELS[key] ?? PATIENT_COUNTRY_LABELS.EG;
  return preferArabic ? row.ar : row.en;
}

export function isPatientCountryCode(value: string): value is PatientCountryCode {
  return (PATIENT_COUNTRY_CODES as readonly string[]).includes(value.trim().toUpperCase());
}

/** Regional-indicator flag emoji for an ISO 3166-1 alpha-2 code (e.g. EG → 🇪🇬). */
export function countryFlagEmoji(code: string | null | undefined): string {
  const cc = code?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(cc)) return "";
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + (cc.charCodeAt(0) - 65),
    base + (cc.charCodeAt(1) - 65),
  );
}
