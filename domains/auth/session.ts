/** True when the user has a persisted session that can call the API. */
export function isSignedIn(
  profile: { id: string } | null | undefined,
  accessToken: string | null | undefined,
): boolean {
  return !!(profile && accessToken);
}
