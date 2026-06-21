import React from "react";
import { StyleSheet, View, type ScrollViewProps } from "react-native";

type Props = ScrollViewProps & {
  children: React.ReactNode;
};

/** On web, auth pages scroll via the outer page shell — no nested scroll views. */
export function KeyboardSafeScrollView({
  children,
  contentContainerStyle,
  style,
}: Props) {
  return (
    <View style={[styles.root, style, contentContainerStyle]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    alignSelf: "stretch",
  },
});
