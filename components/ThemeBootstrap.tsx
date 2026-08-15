import { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import colors from "@/constants/colors";
import { resolveTheme, useThemeStore } from "@/domains/theme/store";

/** Syncs OS status bar + web document surfaces with the active theme. */
export function ThemeBootstrap() {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();
  const resolved = resolveTheme(mode, systemScheme);
  const palette = colors[resolved];

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.colorScheme = resolved;
    root.dataset.theme = resolved;
    root.style.setProperty("--app-bg", palette.background);
    root.style.setProperty("--app-fg", palette.foreground);
    document.body.style.backgroundColor = palette.background;
    document.body.style.color = palette.foreground;

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", palette.background);
  }, [resolved, palette.background, palette.foreground]);

  return <StatusBar style={resolved === "dark" ? "light" : "dark"} />;
}
