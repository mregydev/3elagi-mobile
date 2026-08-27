/**
 * What a doctor charges the patient looking at them.
 *
 * Mirrors the API's resolveDoctorFee: a patient in the doctor's own country
 * pays the local price (EGP in Egypt, JOD in Jordan); everyone else pays the
 * USD price. An unknown viewer country counts as abroad — never quote the
 * cheaper local rate on a guess.
 */
export type FeeCurrency = "EGP" | "JOD" | "USD";
export type ConsultationKind = "text" | "video";

export interface DoctorFees {
  textPriceLocal?: number | null;
  textPriceUsd?: number | null;
  videoPriceLocal?: number | null;
  videoPriceUsd?: number | null;
  /** The doctor's own country. */
  country?: string | null;
}

/** Starting prices by market — mirrors the API defaults. */
export const DEFAULT_DOCTOR_FEES = {
  EG: { local: 200, usd: 50 },
  JO: { local: 15, usd: 50 },
} as const;

/** Pre-filled signup / profile form strings for a doctor's market. */
export function defaultDoctorFeeFormValues(country?: string | null) {
  const code = country?.trim().toUpperCase();
  const fees = code === "JO" ? DEFAULT_DOCTOR_FEES.JO : DEFAULT_DOCTOR_FEES.EG;
  const local = String(fees.local);
  const usd = String(fees.usd);
  return { textLocal: local, textUsd: usd, videoLocal: local, videoUsd: usd };
}

/** Blank stays blank — an unset fee is not a free one. */
export function feeText(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function feeValue(text: string): number | null {
  const n = Number(text.trim());
  return text.trim() && Number.isFinite(n) && n >= 0 ? n : null;
}

export function localFeeCurrency(country?: string | null): FeeCurrency {
  const code = country?.trim().toUpperCase();
  if (code === "EG") return "EGP";
  if (code === "JO") return "JOD";
  return "USD";
}

export function resolveDoctorFee(
  doctor: DoctorFees,
  viewerCountry: string | null | undefined,
  kind: ConsultationKind,
): { amount: number; currency: FeeCurrency } | null {
  const home = doctor.country?.trim().toUpperCase() || "";
  const viewer = viewerCountry?.trim().toUpperCase() || "";
  const isHome = !!home && viewer === home;

  const raw = isHome
    ? kind === "video"
      ? doctor.videoPriceLocal
      : doctor.textPriceLocal
    : kind === "video"
      ? doctor.videoPriceUsd
      : doctor.textPriceUsd;

  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount, currency: isHome ? localFeeCurrency(home) : "USD" };
}

/** "250 EGP", or null when the doctor has not priced that kind. */
export function formatDoctorFee(
  doctor: DoctorFees,
  viewerCountry: string | null | undefined,
  kind: ConsultationKind,
): string | null {
  const fee = resolveDoctorFee(doctor, viewerCountry, kind);
  if (!fee) return null;
  return `${fee.amount.toLocaleString("en-US", {
    maximumFractionDigits: fee.amount % 1 === 0 ? 0 : 2,
  })} ${fee.currency}`;
}
