import { useEffect, useMemo, useState } from "react";
import {
  fetchPointPricing,
  type PointCurrency,
  type PointPricing,
} from "@/domains/points/api";
import { detectCountryFromIp } from "@/domains/points/detectCountry";
import { pricePerPoint } from "@/constants/patientCountries";

/** Live credit price for the caller's IP (never profile country). */
export function useIpPointPricing() {
  const [pricing, setPricing] = useState<PointPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientCountry, setClientCountry] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const geo = await detectCountryFromIp();
      if (cancelled) return;
      setClientCountry(geo);
      const next = await fetchPointPricing(geo);
      if (!cancelled) {
        setPricing(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const detectedCountry = pricing?.detectedCountry ?? clientCountry;

  const rate =
    pricing?.pricePerPoint ?? pricePerPoint(detectedCountry ?? "XX");
  const currency: PointCurrency = pricing?.currency ?? "USD";
  const market =
    pricing?.market ??
    (detectedCountry === "EG" ? "EG" : detectedCountry === "JO" ? "JO" : "INTL");

  const moneyForAmount = useMemo(
    () => (points: number) => Math.round(points) * rate,
    [rate],
  );

  return {
    pricing,
    loading,
    detectedCountry,
    market,
    rate,
    currency,
    moneyForAmount,
  };
}
