import { Moon, Sun } from "lucide-react-native";
import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { UI } from "@/constants/uiTokens";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";

const TRACK_W = 56;
const TRACK_H = 30;
const THUMB = 24;
const PAD = 3;
const TRAVEL = TRACK_W - THUMB - PAD * 2;

type CornerVariant = "header" | "fixed";

interface ThemeToggleProps {
  style?: ViewStyle;
}

export function ThemeToggle({ style }: ThemeToggleProps) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDark, setMode } = useTheme();
  const progress = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isDark ? 1 : 0, { duration: UI.duration.normal });
  }, [isDark, progress]);

  const toggle = () => setMode(isDark ? "light" : "dark");

  const thumbStyle = useAnimatedStyle(() => {
    const from = isRTL ? PAD + TRAVEL : PAD;
    const to = isRTL ? PAD : PAD + TRAVEL;
    return {
      transform: [{ translateX: from + (to - from) * progress.value }],
    };
  });

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [
        isDark ? colors.secondary : colors.muted,
        isDark ? `${colors.primary}55` : `${colors.primary}22`,
      ],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [isDark ? `${colors.foreground}55` : colors.border, colors.primary],
    ),
  }));

  const sunStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0.45]),
  }));

  const moonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.45, 1]),
  }));

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={isDark ? t.settings.themeDark : t.settings.themeLight}
      hitSlop={8}
      style={({ pressed }) => [
        style,
        pressed ? { opacity: 0.88 } : null,
        Platform.OS === "web" ? UI.pressable : null,
      ]}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <View style={[styles.icons, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Animated.View style={sunStyle}>
            <Sun size={14} color={isDark ? "#fbbf24" : colors.primary} />
          </Animated.View>
          <Animated.View style={moonStyle}>
            <Moon
              size={14}
              color={isDark ? colors.foreground : colors.mutedForeground}
            />
          </Animated.View>
        </View>
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: isDark ? colors.foreground : colors.card,
              borderWidth: isDark ? 0 : StyleSheet.hairlineWidth,
              borderColor: colors.border,
            },
            isDark ? null : UI.shadow,
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

interface ThemeToggleCornerProps {
  variant?: CornerVariant;
}

/** End-edge placement: top-right in LTR, top-left in RTL. */
export function ThemeToggleCorner({ variant = "header" }: ThemeToggleCornerProps) {
  const colors = useColors();
  const { isRTL } = useI18n();

  const positionStyle: ViewStyle =
    variant === "fixed"
      ? {
          position: "absolute",
          top: 16,
          zIndex: 50,
          ...(isRTL ? { left: 16, right: undefined } : { right: 16, left: undefined }),
        }
      : {
          position: "absolute",
          top: 0,
          bottom: 0,
          justifyContent: "center",
          zIndex: 2,
          ...(isRTL ? { left: 12, right: undefined } : { right: 12, left: undefined }),
        };

  return (
    <View
      style={[
        positionStyle,
        variant === "fixed"
          ? {
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 6,
              borderWidth: 1,
              borderColor: colors.border,
              ...UI.shadow,
            }
          : null,
      ]}
      pointerEvents="box-none"
    >
      <ThemeToggle />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    borderWidth: 1,
    justifyContent: "center",
  },
  icons: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  thumb: {
    position: "absolute",
    top: PAD,
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
  },
});
