/**
 * USD value of one consultation credit by patient market (matches top-up pricing):
 * Egypt 2 USD, Jordan 15 USD, anywhere else 50 USD.
 *
 * Doctor payout uses the patient's profile country; credit purchase uses IP.
 */
const USD_PER_POINT: Record<"EG" | "JO" | "INTL", number> = {
  EG: 2,
  JO: 15,
  INTL: 50,
};

function marketOf(country?: string | null): "EG" | "JO" | "INTL" {
  const code = country?.trim().toUpperCase();
  if (code === "EG" || code === "JO") return code;
  return "INTL";
}

export function usdPerPoint(country?: string | null): number {
  return USD_PER_POINT[marketOf(country)];
}

export function pointsToUsd(points: number, country?: string | null): number {
  const safe = Number.isFinite(points) ? points : 0;
  return safe * usdPerPoint(country);
}

export function formatUsd(amount: number): string {
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} USD`;
}
