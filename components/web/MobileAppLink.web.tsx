import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { MobileAppDownloadModal } from "@/components/web/MobileAppDownloadModal.web";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { flexRow } from "@/utils/rtl";

type Props = {
  variant?: "link" | "nav" | "button" | "toolbar";
};

/** Full Android robot (head, arms, body, legs) filled with a blue gradient. */
function AndroidRobot({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" accessibilityLabel="Android">
      <Defs>
        {/* userSpaceOnUse so every limb shares one ramp instead of repeating it. */}
        <LinearGradient
          id="androidBlue"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2="512"
        >
          <Stop offset="0" stopColor="#5B9DFF" />
          <Stop offset="1" stopColor="#1D3FCC" />
        </LinearGradient>
      </Defs>
      {/* antennae */}
      <Path
        d="M168 14 L196 58 M344 14 L316 58"
        stroke="url(#androidBlue)"
        strokeWidth={14}
        strokeLinecap="round"
      />
      {/* head */}
      <Path d="M118 158 A138 138 0 0 1 394 158 Z" fill="url(#androidBlue)" />
      <Circle cx={190} cy={96} r={14} fill="#ffffff" />
      <Circle cx={322} cy={96} r={14} fill="#ffffff" />
      {/* arms */}
      <Rect x={36} y={168} width={58} height={188} rx={29} fill="url(#androidBlue)" />
      <Rect x={418} y={168} width={58} height={188} rx={29} fill="url(#androidBlue)" />
      {/* body */}
      <Rect x={118} y={172} width={276} height={232} rx={24} fill="url(#androidBlue)" />
      <Rect x={118} y={172} width={276} height={40} fill="url(#androidBlue)" />
      {/* legs */}
      <Rect x={172} y={382} width={60} height={118} rx={30} fill="url(#androidBlue)" />
      <Rect x={280} y={382} width={60} height={118} rx={30} fill="url(#androidBlue)" />
    </Svg>
  );
}

export function MobileAppLink({ variant = "link" }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const dir = flexRow(isRTL);
  const [open, setOpen] = useState(false);

  if (!isDesktop) return null;
  const iconSize =
    variant === "nav" ? 18 : variant === "button" ? 20 : variant === "toolbar" ? 16 : 16;
  const labelStyle =
    variant === "nav"
      ? styles.navLabel
      : variant === "button"
        ? styles.buttonText
        : variant === "toolbar"
          ? styles.toolbarText
          : styles.linkText;
  const labelColor =
    variant === "link" ? colors.primary : colors.foreground;
  const baseStyle =
    variant === "nav"
      ? styles.navItem
      : variant === "button"
        ? styles.button
        : variant === "toolbar"
          ? styles.toolbar
          : styles.link;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t.mobileApp.linkLabel}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          baseStyle,
          variant === "nav"
            ? {
                flexDirection: dir,
                borderColor: colors.border,
                backgroundColor: pressed || hovered ? colors.muted : "transparent",
              }
            : variant === "button" || variant === "toolbar"
              ? {
                  flexDirection: dir,
                  borderColor: colors.border,
                  backgroundColor: pressed || hovered ? colors.muted : colors.card,
                }
              : {
                  flexDirection: dir,
                  backgroundColor: pressed || hovered ? `${colors.primary}10` : "transparent",
                },
          pressed && styles.pressed,
        ]}
      >
        <AndroidRobot size={iconSize + 2} />
        <Text style={[labelStyle, { color: labelColor }]}>
          {t.mobileApp.linkLabel}
        </Text>
      </Pressable>

      <MobileAppDownloadModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    cursor: "pointer" as "auto",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "700",
  },
  button: {
    width: "100%",
    minHeight: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderWidth: 1.5,
    cursor: "pointer" as "auto",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  toolbar: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    cursor: "pointer" as "auto",
  },
  toolbarText: {
    fontSize: 13,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  navItem: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    cursor: "pointer" as "auto",
  },
  navLabel: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
});
