import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export function AppToast() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topOffset = Platform.OS === "web" ? 16 : insets.top + 8;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Toast
        topOffset={topOffset}
        config={{
          success: (props) => (
            <BaseToast
              {...props}
              style={{
                borderLeftColor: "#10b981",
                backgroundColor: colors.card,
                borderColor: colors.border,
                width: "92%",
                maxWidth: 420,
              }}
              contentContainerStyle={{ paddingHorizontal: 14 }}
              text1Style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}
              text2Style={{ fontSize: 13, color: colors.mutedForeground }}
            />
          ),
          error: (props) => (
            <ErrorToast
              {...props}
              style={{
                borderLeftColor: "#ef4444",
                backgroundColor: colors.card,
                borderColor: colors.border,
                width: "92%",
                maxWidth: 420,
              }}
              contentContainerStyle={{ paddingHorizontal: 14 }}
              text1Style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}
              text2Style={{ fontSize: 13, color: colors.mutedForeground }}
            />
          ),
          info: (props) => (
            <BaseToast
              {...props}
              style={{
                borderLeftColor: colors.primary,
                backgroundColor: colors.card,
                borderColor: colors.border,
                width: "92%",
                maxWidth: 420,
              }}
              contentContainerStyle={{ paddingHorizontal: 14 }}
              text1Style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}
              text2Style={{ fontSize: 13, color: colors.mutedForeground }}
            />
          ),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    elevation: 999999,
  },
});
