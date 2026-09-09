import { patientGeoCountry } from "@/constants/patientCountries";

/** Patient residence for doctor fee display. Temporarily fixed to KSA. */
export function useViewerCountry(): string {
  return patientGeoCountry();
}
