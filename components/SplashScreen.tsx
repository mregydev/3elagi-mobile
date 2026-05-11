import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Logo3elagi } from "@/components/Logo3elagi";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

export function AppSplash({ onDone }: { onDone: () => void }) {
  const colors = useColors();
  const { t } = useI18n();
  const { width: screenWidth } = useWindowDimensions();
  const logoHeight = Math.min(88, (screenWidth - 48) / 4);
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
    const timer = setTimeout(onDone, 1600);
    return () => clearTimeout(timer);
  }, [onDone, opacity, scale]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[styles.content, { opacity, transform: [{ scale }] }]}
      >
        <Logo3elagi height={logoHeight} />
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          {t.app.tagline}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  tagline: { fontSize: 14, marginTop: 14, fontWeight: "600" },
});
