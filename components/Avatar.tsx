import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Presence } from "@/domains/chat/types";

interface Props {
  uri?: string;
  size?: number;
  presence?: Presence;
}

const dotColor = (p: Presence | undefined, success: string, warning: string) => {
  if (p === "online") return success;
  if (p === "away") return warning;
  return "#9aa6b2";
};

export function Avatar({ uri, size = 52, presence }: Props) {
  const colors = useColors();
  const dot = (size / 14) * 4 + 2;
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={{
          uri:
            uri ||
            "https://api.dicebear.com/9.x/avataaars/png?seed=anon",
        }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.muted,
        }}
      />
      {presence ? (
        <View
          style={[
            styles.dot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: dotColor(presence, colors.success, colors.warning),
              borderColor: colors.background,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
});
