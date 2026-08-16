import { Platform, StyleSheet, type ViewStyle } from "react-native";

/** Shared visual tokens — calm medical aesthetic, blue primary, 8px spacing grid. */
export const UI = {
  radius: {
    card: 16,
    inner: 12,
    chip: 999,
    icon: 10,
    xl: 20,
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
    title: { fontSize: 15, fontWeight: "700" as const, letterSpacing: -0.15 },
    section: { fontSize: 17, fontWeight: "700" as const, letterSpacing: -0.2 },
    subtitle: { fontSize: 14, fontWeight: "500" as const, lineHeight: 20 },
    meta: { fontSize: 12, fontWeight: "500" as const, lineHeight: 17 },
    cta: { fontSize: 14, fontWeight: "600" as const },
  },
  shadow: Platform.select({
    web: { boxShadow: "0 1px 4px rgba(26,33,50,0.06)" } as ViewStyle,
    default: {
      shadowColor: "#1a2132",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    } as ViewStyle,
  }),
  shadowMd: Platform.select({
    web: { boxShadow: "0 4px 14px rgba(26,33,50,0.08)" } as ViewStyle,
    default: {
      shadowColor: "#1a2132",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    } as ViewStyle,
  }),
  shadowXl: Platform.select({
    web: { boxShadow: "0 18px 45px rgba(26,33,50,0.14)" } as ViewStyle,
    default: {
      shadowColor: "#1a2132",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.14,
      shadowRadius: 24,
      elevation: 8,
    } as ViewStyle,
  }),
  /** Green "live" halo — pairs with the consultation pulse on the hero monitor. */
  shadowGlow: Platform.select({
    web: { boxShadow: "0 0 24px rgba(34,197,94,0.45)" } as ViewStyle,
    default: {
      shadowColor: "#22c55e",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 14,
      elevation: 0,
    } as ViewStyle,
  }),
  shadowHover: Platform.select({
    web: {
      boxShadow: "0 6px 20px rgba(26,33,50,0.1)",
      transition: "box-shadow 180ms ease, transform 180ms ease",
    } as ViewStyle,
    default: {},
  }),
  pressable: Platform.select({
    web: { transition: "opacity 150ms ease, background-color 150ms ease" } as ViewStyle,
    default: {},
  }),
};

/** Primary card surface — soft shadow, minimal border. */
export function surfaceCard(backgroundColor: string, borderColor?: string): ViewStyle {
  return {
    backgroundColor,
    borderRadius: UI.radius.card,
    ...UI.shadow,
    ...(borderColor
      ? Platform.select({
          web: {
            boxShadow: `0 1px 4px rgba(26,33,50,0.06), inset 0 0 0 1px ${borderColor}40`,
          } as ViewStyle,
          default: { borderWidth: StyleSheet.hairlineWidth, borderColor: `${borderColor}55` },
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
    paddingVertical: UI.space.lg,
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
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: UI.radius.inner,
    minHeight: 42,
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
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: UI.radius.inner,
    borderWidth: 1,
    borderColor,
    backgroundColor,
    minHeight: 42,
    ...UI.pressable,
  };
}
