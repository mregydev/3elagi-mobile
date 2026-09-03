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
