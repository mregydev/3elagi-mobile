import colors from "@/constants/colors";

// Stable reference: returning a fresh object each render invalidated every
// memo/callback that depends on `colors`, causing app-wide re-renders and
// sluggish tab switches. The palette is static, so compute it once.
const palette = { ...colors.light, radius: colors.radius };

export function useColors() {
  return palette;
}
