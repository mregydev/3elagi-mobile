import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo3elagi } from "@/components/Logo3elagi";
import { LOGO_HEIGHT } from "@/constants/brand";
import { useColors } from "@/hooks/useColors";
import { useHubEmbedded } from "@/hooks/useHubEmbedded";

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
  // Inside the Patients hub the hub owns the brand header, so drop the logo
  // here (and skip entirely when there's nothing else to show).
  const embedded = useHubEmbedded();

  if (embedded && !children) return null;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: embedded ? 8 : insets.top + 10,
          backgroundColor: surface === "card" ? colors.card : colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {embedded ? null : (
        <View style={styles.brandRow}>
          <Logo3elagi height={LOGO_HEIGHT.header} />
        </View>
      )}
      {children ? (
        <View style={embedded ? undefined : styles.below}>{children}</View>
      ) : null}
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
