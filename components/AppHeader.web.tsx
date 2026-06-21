import React from "react";
import { StyleSheet, View } from "react-native";
import { Logo3elagi } from "@/components/Logo3elagi";
import { LOGO_HEIGHT } from "@/constants/brand";
import { useColors } from "@/hooks/useColors";
import { useWebLayout } from "@/hooks/useWebLayout";

interface Props {
  children?: React.ReactNode;
  surface?: "background" | "card";
}

export function AppHeader({ children, surface = "background" }: Props) {
  const colors = useColors();
  const { isDesktop } = useWebLayout();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: surface === "card" ? colors.card : colors.background,
          borderBottomColor: colors.border,
          paddingTop: isDesktop ? 16 : 10,
        },
      ]}
    >
      {!isDesktop ? (
        <View style={styles.brandRow}>
          <Logo3elagi height={LOGO_HEIGHT.header} />
        </View>
      ) : null}
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
