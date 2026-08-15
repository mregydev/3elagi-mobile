import { Platform, type ViewStyle } from "react-native";

/** Shared visual tokens for premium card consistency. */
export const UI = {
  radius: {
    card: 14,
    chip: 999,
    icon: 10,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
  },
  type: {
    title: { fontSize: 15, fontWeight: "800" as const, letterSpacing: -0.2 },
    subtitle: { fontSize: 12, fontWeight: "600" as const, lineHeight: 16 },
    meta: { fontSize: 11, fontWeight: "600" as const, lineHeight: 14 },
    cta: { fontSize: 12, fontWeight: "800" as const },
  },
  shadow: Platform.select({
    web: { boxShadow: "0 1px 4px rgba(26,33,50,0.04)" } as ViewStyle,
    default: {
      shadowColor: "#1a2132",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    } as ViewStyle,
  }),
  shadowHover: Platform.select({
    web: { boxShadow: "0 4px 14px rgba(48,87,242,0.08)" } as ViewStyle,
    default: {},
  }),
};

/** Card surface — light shadow, minimal border (marketplace style). */
export function cardShellSoft(backgroundColor: string, borderColor?: string): ViewStyle {
  return {
    backgroundColor,
    borderRadius: UI.radius.card,
    borderWidth: 0,
    ...UI.shadow,
    ...(borderColor
      ? Platform.select({
          web: { boxShadow: `0 1px 4px rgba(26,33,50,0.04), inset 0 0 0 1px ${borderColor}40` } as ViewStyle,
          default: { borderWidth: 1, borderColor: `${borderColor}66` },
        })
      : {}),
  };
}

export function cardShell(borderColor: string, backgroundColor: string): ViewStyle {
  return {
    backgroundColor,
    borderColor,
    borderWidth: 1,
    borderRadius: UI.radius.card,
    ...UI.shadow,
  };
}
