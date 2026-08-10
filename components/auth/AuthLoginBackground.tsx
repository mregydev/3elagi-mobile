import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  children: React.ReactNode;
}

/**
 * Native auth shell background: a plain grey gradient, no photo.
 * (The web shell keeps its hero image — see AuthLoginBackground.web.tsx.)
 */
export function AuthLoginBackground({ children }: Props) {
  return (
    <View style={styles.page}>
      <LinearGradient
        colors={["#fbfcfd", "#eef1f5", "#dde3ea"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
});
