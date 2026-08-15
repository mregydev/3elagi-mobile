import { useMemo } from "react";
import { useColorScheme } from "react-native";
import colors from "@/constants/colors";
import { resolveTheme, useThemeStore } from "@/domains/theme/store";

export type AppColors = (typeof colors)["light"] & { radius: number };

export function useColors(): AppColors {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();
  const resolved = resolveTheme(mode, systemScheme);

  return useMemo(
    () => ({ ...colors[resolved], radius: colors.radius }),
    [resolved],
  );
}

export function useResolvedTheme() {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();
  return resolveTheme(mode, systemScheme);
}
