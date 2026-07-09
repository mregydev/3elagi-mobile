import type { Translations } from "@/constants/translations";
import { getApiLang, getDict } from "@/domains/i18n/store";

function dict(t?: Translations): Translations {
  return t ?? getDict(getApiLang());
}

/** Format an EGP credit amount using i18n. */
export function formatEgp(amount: number, t?: Translations): string {
  return dict(t).credits.egp(Math.round(amount));
}

export function formatEgpPerUnit(amount: number, t?: Translations): string {
  return dict(t).credits.egpPerConsultation(Math.round(amount));
}
