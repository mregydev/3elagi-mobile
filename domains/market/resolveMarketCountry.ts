import { Platform } from "react-native";
import {
  normalizeMarketCountry,
  type MarketCountryCode,
} from "@/constants/patientCountries";
import { WEB_APP_URL } from "@/constants/webAppUrl";

/** Parse market from a hostname (e.g. egypt.3elagi.net → EG). */
export function marketCountryFromHostname(
  hostname: string,
): MarketCountryCode | null {
  const host = hostname.trim().toLowerCase();
  if (!host) return null;
  if (host.includes("egypt")) return "EG";
  if (host.includes("jordan")) return "JO";
  return null;
}

/** Current host: browser location on web, WEB_APP_URL on native shells. */
export function getRuntimeHostname(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location?.hostname ?? "";
  }
  try {
    return new URL(WEB_APP_URL).hostname;
  } catch {
    return "";
  }
}

/**
 * When the domain contains "egypt" or "jordan", lock the doctor market.
 * Returns null on generic domains (use profile country instead).
 */
export function getDomainMarketCountry(): MarketCountryCode | null {
  return marketCountryFromHostname(getRuntimeHostname());
}

/**
 * Country used when browsing doctors on Home:
 * domain lock → profile country → Egypt default.
 */
export function resolveBrowseMarketCountry(
  profileCountry?: string | null,
): MarketCountryCode {
  return getDomainMarketCountry() ?? normalizeMarketCountry(profileCountry);
}
