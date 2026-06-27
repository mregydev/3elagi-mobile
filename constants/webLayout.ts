export const WEB_BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

export const WEB_MAX_WIDTH = {
  content: 1200,
  wide: 1400,
  stack: 960,
  auth: 640,
  chat: 980,
  profile: 1200,
} as const;

/** Tab bar content row height on mobile web (matches `(tabs)/_layout.web`). */
export const WEB_MOBILE_TAB_BAR_HEIGHT = 60;

/** Minimum top inset for tab page titles/logos on mobile web (below status bar). */
export const WEB_MOBILE_PAGE_TITLE_TOP_PADDING = 36;

export function mobileWebTabBarHeight(bottomInset: number): number {
  return WEB_MOBILE_TAB_BAR_HEIGHT + Math.max(bottomInset, 8);
}

/** Top padding for mobile web page titles — respects safe area when available. */
export function mobileWebPageTitlePaddingTop(safeAreaTop: number): number {
  return Math.max(safeAreaTop, WEB_MOBILE_PAGE_TITLE_TOP_PADDING);
}
