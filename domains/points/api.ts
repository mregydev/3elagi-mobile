import { API_BASE } from "@/constants/api";

/** Matches API signup default (`DEFAULT_MESSAGE_POINTS`). */
export const DEFAULT_AVAILABLE_POINTS = 10;

export interface PointsSummary {
  message_points: number;
  points_reserved?: number;
  points_spent_total: number;
  points_purchased_total: number;
  points_reimbursed_total?: number;
}

export async function fetchPointsBalance(token: string): Promise<PointsSummary> {
  const res = await fetch(`${API_BASE}/points`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as PointsSummary & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Failed to load points (${res.status})`);
  }
  return data;
}

export async function reimbursePoints(token: string): Promise<PointsSummary> {
  const res = await fetch(`${API_BASE}/points/reimburse`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as PointsSummary & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Failed to reimburse (${res.status})`);
  }
  return data;
}

export async function createVisaCheckout(
  token: string,
  amount: number,
): Promise<{ checkout_url: string }> {
  const res = await fetch(`${API_BASE}/payments/credits/checkout/visa`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    checkout_url?: string;
    message?: string;
  };
  if (!res.ok || !data.checkout_url) {
    throw new Error(data.message ?? `Failed to start card payment (${res.status})`);
  }
  return { checkout_url: data.checkout_url };
}

export async function addMessagePoints(
  token: string,
  amount: number,
): Promise<PointsSummary> {
  const res = await fetch(`${API_BASE}/points/add`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });
  const data = (await res.json().catch(() => ({}))) as PointsSummary & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Failed to add points (${res.status})`);
  }
  return data;
}

export interface PointPricing {
  market: "EG" | "JO" | "INTL";
  currency: "EGP" | "JOD" | "USD";
  pricePerPoint: number;
  /** Country the server read from the caller's IP, null when undetectable. */
  detectedCountry: string | null;
}

/** Live per-point price for wherever the caller is (public — no token). */
export async function fetchPointPricing(): Promise<PointPricing | null> {
  try {
    const res = await fetch(`${API_BASE}/points/pricing`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      market?: PointPricing["market"];
      currency?: PointPricing["currency"];
      price_per_point?: number;
      detected_country?: string | null;
    };
    if (!data?.currency || typeof data.price_per_point !== "number") return null;
    return {
      market: data.market ?? "EG",
      currency: data.currency,
      pricePerPoint: data.price_per_point,
      detectedCountry: data.detected_country ?? null,
    };
  } catch {
    // Fall back to the profile-country price the screen already computes.
    return null;
  }
}
