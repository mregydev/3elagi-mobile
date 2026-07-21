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

/**
 * Live markets: Egypt & Jordan.
 * Signup, doctor browse, and currency use this set.
 */
export const MARKET_COUNTRY_CODES = ["EG", "JO"] as const;
export type MarketCountryCode = (typeof MARKET_COUNTRY_CODES)[number];

export const DEFAULT_PATIENT_COUNTRY: MarketCountryCode = "EG";

/** @deprecated use MARKET_COUNTRY_CODES — alias for roster filter. */
export const DOCTOR_FILTER_COUNTRY_CODES = MARKET_COUNTRY_CODES;
export type DoctorFilterCountryCode = MarketCountryCode;

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
  const key = code?.trim().toUpperCase() || DEFAULT_PATIENT_COUNTRY;
  const row = PATIENT_COUNTRY_LABELS[key as PatientCountryCode] ?? PATIENT_COUNTRY_LABELS.EG;
  return preferArabic ? row.ar : row.en;
}

export function isPatientCountryCode(value: string): value is PatientCountryCode {
  return (PATIENT_COUNTRY_CODES as readonly string[]).includes(value.trim().toUpperCase());
}

export function isMarketCountryCode(value: string): value is MarketCountryCode {
  return (MARKET_COUNTRY_CODES as readonly string[]).includes(value.trim().toUpperCase());
}

/** Clamp any stored country to a live market (default Egypt). */
export function normalizeMarketCountry(
  value?: string | null,
): MarketCountryCode {
  if (!value?.trim()) return DEFAULT_PATIENT_COUNTRY;
  const code = value.trim().toUpperCase();
  return isMarketCountryCode(code) ? code : DEFAULT_PATIENT_COUNTRY;
}

/** Display currency for the patient's selected market. */
export function marketCurrencyLabel(
  country: string | null | undefined,
  preferArabic: boolean,
): string {
  const code = normalizeMarketCountry(country);
  if (code === "JO") return preferArabic ? "دينار" : "JOD";
  return preferArabic ? "جنيه" : "EGP";
}

export function marketCurrencyCode(country: string | null | undefined): "EGP" | "JOD" {
  return normalizeMarketCountry(country) === "JO" ? "JOD" : "EGP";
}

/** Cash charged per 1 credit/point in the live market. */
export function pricePerPoint(country: string | null | undefined): number {
  return normalizeMarketCountry(country) === "JO" ? 5 : 100;
}

/** Total cash to charge for buying `points` in the given market. */
export function moneyForPoints(
  points: number,
  country: string | null | undefined,
): number {
  return Math.round(points) * pricePerPoint(country);
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
