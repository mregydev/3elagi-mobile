import { useEffect, useState } from "react";
import { detectCountryFromIp } from "@/domains/points/detectCountry";

/**
 * ISO-2 country of whoever is looking, from their IP. Cached for the session by
 * detectCountryFromIp, so mounting this on every doctor card costs one lookup.
 * `null` until it answers — treated as "abroad" by the fee helpers.
 */
export function useViewerCountry(): string | null {
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void detectCountryFromIp()
      .then((code) => {
        if (!cancelled) setCountry(code);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return country;
}
