import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo3elagi } from "@/components/Logo3elagi";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  /** Optional content rendered below the brand row (e.g. a search bar). */
  children?: React.ReactNode;
  /** When true, header background uses `card` instead of `background`. */
  surface?: "background" | "card";
}

export function AppHeader({ children, surface = "background" }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isRTL } = useI18n();
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + 10,
          backgroundColor: surface === "card" ? colors.card : colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.brandRow,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <Logo3elagi height={32} />
        <LanguageSwitch />
      </View>
      {children ? <View style={styles.below}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  brandRow: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  below: { marginTop: 4 },
});
