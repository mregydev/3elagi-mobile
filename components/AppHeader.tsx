import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo3elagi } from "@/components/Logo3elagi";
import { LOGO_HEIGHT } from "@/constants/brand";
import { useColors } from "@/hooks/useColors";

interface Props {
  /** Optional content rendered below the brand row (e.g. a search bar). */
  children?: React.ReactNode;
  /** When true, header background uses `card` instead of `background`. */
  surface?: "background" | "card";
  borderless?: boolean;
  title?: string;
}

export function AppHeader({ children, surface = "background" }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

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
      <View style={styles.brandRow}>
        <Logo3elagi height={LOGO_HEIGHT.header} />
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
    justifyContent: "center",
  },
  below: { marginTop: 4 },
});
