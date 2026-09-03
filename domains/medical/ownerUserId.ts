/** Patient user id for medical forms — URL param when set, otherwise the signed-in user. */
export function resolveMedicalOwnerUserId(
  patientUserIdParam: string | undefined,
  profileId: string | undefined,
): string {
  const fromParam = patientUserIdParam?.trim();
  if (fromParam) return fromParam;
  return profileId?.trim() ?? "";
}

/** True when a doctor is adding a record for another patient (not their own). */
export function isDoctorAddingForPatient(
  role: string | null | undefined,
  patientUserIdParam: string | undefined,
  profileId: string | undefined,
): boolean {
  if (role?.toLowerCase() !== "doctor") return false;
  const fromParam = patientUserIdParam?.trim();
  if (!fromParam) return false;
  return fromParam !== profileId?.trim();
}
