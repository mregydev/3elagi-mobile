/**
 * Patient residence + market helpers.
 * Full country list lives in worldCountries.ts (keep in sync with API world-countries.ts).
 */
export {
  CONTINENT_LABELS,
  PATIENT_COUNTRY_CODES,
  PATIENT_COUNTRY_LABELS,
  WORLD_COUNTRIES,
  type PatientCountryCode,
  type WorldContinent,
  type WorldCountry,
} from "@/constants/worldCountries";

import {
  PATIENT_COUNTRY_CODES,
  PATIENT_COUNTRY_LABELS,
  WORLD_COUNTRIES,
  type PatientCountryCode,
  type WorldCountry,
} from "@/constants/worldCountries";

/**
 * Live markets: Egypt & Jordan.
 * Doctor signup, doctor browse, and currency use this set.
 * Patient signup/residence uses PATIENT_COUNTRY_CODES (all countries).
 */
export const MARKET_COUNTRY_CODES = ["EG", "JO"] as const;
export type MarketCountryCode = (typeof MARKET_COUNTRY_CODES)[number];

export const DEFAULT_PATIENT_COUNTRY: MarketCountryCode = "EG";

/** @deprecated use MARKET_COUNTRY_CODES — alias for roster filter. */
export const DOCTOR_FILTER_COUNTRY_CODES = MARKET_COUNTRY_CODES;
export type DoctorFilterCountryCode = MarketCountryCode;

export function patientCountryLabel(
  code: string | null | undefined,
  preferArabic: boolean,
): string {
  const key = code?.trim().toUpperCase() || DEFAULT_PATIENT_COUNTRY;
  const row = PATIENT_COUNTRY_LABELS[key] ?? PATIENT_COUNTRY_LABELS.EG;
  return preferArabic ? row.ar : row.en;
}

export function isPatientCountryCode(value: string): value is PatientCountryCode {
  return (PATIENT_COUNTRY_CODES as readonly string[]).includes(
    value.trim().toUpperCase(),
  );
}

export function isMarketCountryCode(value: string): value is MarketCountryCode {
  return (MARKET_COUNTRY_CODES as readonly string[]).includes(
    value.trim().toUpperCase(),
  );
}

/** Clamp any stored country to a live market (default Egypt). */
export function normalizeMarketCountry(
  value?: string | null,
): MarketCountryCode {
  if (!value?.trim()) return DEFAULT_PATIENT_COUNTRY;
  const code = value.trim().toUpperCase();
  return isMarketCountryCode(code) ? code : DEFAULT_PATIENT_COUNTRY;
}

/** Normalize free-text / DTO country to a supported code; default Egypt. */
export function normalizePatientCountry(
  value?: string | null,
): PatientCountryCode {
  if (!value?.trim()) return DEFAULT_PATIENT_COUNTRY;
  const code = value.trim().toUpperCase();
  return isPatientCountryCode(code) ? code : DEFAULT_PATIENT_COUNTRY;
}

/** Display currency for the patient's selected market. */
/** Egypt, Jordan, or everywhere else — mirrors the API's point markets. */
export type PointMarket = "EG" | "JO" | "INTL";

export function resolvePointMarket(
  country: string | null | undefined,
): PointMarket {
  const code = country?.trim().toUpperCase();
  if (code === "EG" || code === "JO") return code;
  return code ? "INTL" : "EG";
}

export function marketCurrencyLabel(
  country: string | null | undefined,
  preferArabic: boolean,
): string {
  const market = resolvePointMarket(country);
  if (market === "JO") return preferArabic ? "دينار" : "JOD";
  if (market === "INTL") return preferArabic ? "دولار" : "USD";
  return preferArabic ? "جنيه" : "EGP";
}

export function marketCurrencyCode(
  country: string | null | undefined,
): "EGP" | "JOD" | "USD" {
  const market = resolvePointMarket(country);
  if (market === "JO") return "JOD";
  if (market === "INTL") return "USD";
  return "EGP";
}

/**
 * Cash charged per 1 credit/point: Egypt 100 EGP, Jordan 10 JOD, rest of the
 * world 5 USD. Keep in step with MARKET_POINT_PRICING on the API.
 */
export function pricePerPoint(country: string | null | undefined): number {
  const market = resolvePointMarket(country);
  if (market === "JO") return 10;
  if (market === "INTL") return 5;
  return 100;
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

/** Case-insensitive match on English name, Arabic name, or ISO code. */
export function filterWorldCountries(
  query: string,
  _preferArabic: boolean,
  codes?: readonly string[],
): WorldCountry[] {
  const allowed = codes
    ? new Set(codes.map((c) => c.trim().toUpperCase()))
    : null;
  const base = allowed
    ? WORLD_COUNTRIES.filter((c) => allowed.has(c.code))
    : [...WORLD_COUNTRIES];
  const q = query.trim().toLowerCase();
  const qRaw = query.trim();
  if (!q) return base;
  return base.filter((c) => {
    return (
      c.en.toLowerCase().includes(q) ||
      c.ar.includes(qRaw) ||
      c.code.toLowerCase().includes(q)
    );
  });
}
