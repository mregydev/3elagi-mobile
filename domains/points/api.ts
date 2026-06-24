import { API_BASE } from "@/constants/api";

/** Matches API signup default (`DEFAULT_MESSAGE_POINTS`). */
export const DEFAULT_AVAILABLE_POINTS = 10;

export interface PointsSummary {
  message_points: number;
  points_spent_total: number;
  points_purchased_total: number;
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
