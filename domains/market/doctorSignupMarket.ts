import type { MarketCountryCode } from "@/constants/patientCountries";
import { getUrlMarketCountry } from "@/domains/market/resolveMarketCountry";

/**
 * In-app override for doctor signup when the runtime URL has no egypt/jordan
 * (typical on native shells). Cleared when leaving doctor signup if needed.
 */
let doctorSignupMarketOverride: MarketCountryCode | null = null;

export function setDoctorSignupMarketOverride(
  market: MarketCountryCode | null,
): void {
  doctorSignupMarketOverride = market;
}

export function getDoctorSignupMarketOverride(): MarketCountryCode | null {
  return doctorSignupMarketOverride;
}

/** An explicit pick wins; otherwise the market implied by the URL. */
export function getDoctorSignupMarket(): MarketCountryCode | null {
  return doctorSignupMarketOverride ?? getUrlMarketCountry();
}
