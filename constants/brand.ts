/** Shared logo heights for consistent branding across native and web. */
export const LOGO_HEIGHT = {
  /** Main tab header (native + web mobile). */
  header: 42,
  /** Desktop web sidebar. */
  sidebar: 40,
  /** Auth brand panel (login/signup desktop). */
  authPanel: 50,
  /** Welcome / marketing hero (desktop web). */
  welcomeDesktop: 76,
  /** Welcome top bar (tablet / mobile web). */
  welcomeBarTablet: 56,
  welcomeBarMobile: 48,
  /** Welcome centered logo (mobile web + native). */
  welcomeHero: 60,
} as const;
