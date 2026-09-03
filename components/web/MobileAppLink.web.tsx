import { Smartphone } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { MobileAppDownloadModal } from "@/components/web/MobileAppDownloadModal.web";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { flexRow } from "@/utils/rtl";

type Props = {
  variant?: "link" | "nav" | "button" | "toolbar";
};

export function MobileAppLink({ variant = "link" }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const dir = flexRow(isRTL);
  const [open, setOpen] = useState(false);

  if (!isDesktop) return null;
  const iconSize =
    variant === "nav" ? 18 : variant === "button" ? 20 : variant === "toolbar" ? 16 : 16;
  const iconColor =
    variant === "nav"
      ? colors.mutedForeground
      : variant === "link"
        ? colors.primary
        : colors.foreground;
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
        <Smartphone size={iconSize} color={iconColor} />
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
    borderWidth: 1,
    borderColor: "transparent",
    cursor: "pointer" as "auto",
  },
  navLabel: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
});
