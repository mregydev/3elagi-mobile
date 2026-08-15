import { Platform, StyleSheet, type ViewStyle } from "react-native";

/** Shared visual tokens — 8px spacing grid, premium healthcare SaaS surfaces. */
export const UI = {
  radius: {
    card: 12,
    inner: 10,
    chip: 999,
    icon: 8,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  duration: {
    fast: 150,
    normal: 200,
  },
  type: {
    title: { fontSize: 15, fontWeight: "800" as const, letterSpacing: -0.2 },
    section: { fontSize: 16, fontWeight: "800" as const, letterSpacing: -0.25 },
    subtitle: { fontSize: 13, fontWeight: "600" as const, lineHeight: 18 },
    meta: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16 },
    cta: { fontSize: 13, fontWeight: "800" as const },
  },
  shadow: Platform.select({
    web: { boxShadow: "0 1px 3px rgba(15,23,42,0.05)" } as ViewStyle,
    default: {
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    } as ViewStyle,
  }),
  shadowHover: Platform.select({
    web: {
      boxShadow: "0 4px 16px rgba(15,23,42,0.08)",
      transition: "box-shadow 180ms ease, transform 180ms ease",
    } as ViewStyle,
    default: {},
  }),
  pressable: Platform.select({
    web: { transition: "opacity 150ms ease, background-color 150ms ease" } as ViewStyle,
    default: {},
  }),
};

/** Primary card surface — clean white/card bg, subtle elevation. */
export function surfaceCard(backgroundColor: string, borderColor?: string): ViewStyle {
  return {
    backgroundColor,
    borderRadius: UI.radius.card,
    ...UI.shadow,
    ...(borderColor
      ? Platform.select({
          web: {
            boxShadow: `0 1px 3px rgba(15,23,42,0.05), inset 0 0 0 1px ${borderColor}33`,
          } as ViewStyle,
          default: { borderWidth: StyleSheet.hairlineWidth, borderColor: `${borderColor}44` },
        })
      : {}),
  };
}

/** @deprecated Prefer surfaceCard */
export function cardShellSoft(backgroundColor: string, borderColor?: string): ViewStyle {
  return surfaceCard(backgroundColor, borderColor);
}

export function cardShell(borderColor: string, backgroundColor: string): ViewStyle {
  return surfaceCard(backgroundColor, borderColor);
}

/** Status pill badge */
export function statusBadge(fg: string, bg: string): ViewStyle {
  return {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: UI.radius.chip,
    backgroundColor: bg,
  };
}

/** Compact empty-state container */
export function emptyStateSurface(backgroundColor: string, borderColor: string): ViewStyle {
  return {
    ...surfaceCard(backgroundColor, borderColor),
    paddingVertical: UI.space.md,
    paddingHorizontal: UI.space.md,
    alignItems: "center",
    gap: UI.space.sm,
  };
}

/** Primary CTA button base */
export function primaryButton(): ViewStyle {
  return {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: UI.radius.inner,
    minHeight: 40,
    ...Platform.select({
      web: { transition: "opacity 150ms ease, background-color 150ms ease" } as ViewStyle,
      default: {},
    }),
  };
}

/** Secondary outline button */
export function secondaryButton(borderColor: string, backgroundColor: string): ViewStyle {
  return {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: UI.radius.inner,
    borderWidth: 1,
    borderColor,
    backgroundColor,
    minHeight: 40,
    ...UI.pressable,
  };
}
