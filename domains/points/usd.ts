/**
 * Doctor-payout rate: 1 credit is worth this many USD. Kept separate from the
 * top-up table (constants live server-side per market) so changing what a
 * doctor is owed never moves what a patient pays to buy credits.
 */
export const USD_PER_POINT = 50;

export function pointsToUsd(points: number): number {
  return (Number.isFinite(points) ? points : 0) * USD_PER_POINT;
}

export function formatUsd(amount: number): string {
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} USD`;
}
