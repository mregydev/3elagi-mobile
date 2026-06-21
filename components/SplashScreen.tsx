import * as ExpoSplashScreen from "expo-splash-screen";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import colors from "@/constants/colors";
import { en } from "@/constants/translations";

const splashLogo = require("@/assets/images/splash-logo.png");

const SPLASH_BACKGROUND = colors.light.background;
const SPLASH_TAGLINE = en.app.tagline;

export function AppSplash({ onDone }: { onDone: () => void }) {
  const { width: screenWidth } = useWindowDimensions();
  const logoWidth = Math.min(screenWidth - 32, 340);
  const logoHeight = logoWidth * (200 / 840);
  const nativeSplashHidden = useRef(false);

  const logoScale = useRef(new Animated.Value(1)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(10)).current;

  const hideNativeSplash = useCallback(() => {
    if (nativeSplashHidden.current) return;
    nativeSplashHidden.current = true;
    void ExpoSplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1.06,
        speed: 14,
        bounciness: 14,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        speed: 16,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        delay: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(taglineTranslateY, {
        toValue: 0,
        duration: 500,
        delay: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [logoScale, onDone, taglineOpacity, taglineTranslateY]);

  return (
    <View
      style={[styles.root, { backgroundColor: SPLASH_BACKGROUND }]}
      onLayout={hideNativeSplash}
    >
      <Animated.View style={{ transform: [{ scale: logoScale }] }}>
        <Image
          source={splashLogo}
          style={{ width: logoWidth, height: logoHeight }}
          contentFit="contain"
          accessibilityLabel="3elagi"
        />
      </Animated.View>

      <Animated.Text
        style={[
          styles.tagline,
          {
            color: colors.light.mutedForeground,
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
          },
        ]}
      >
        {SPLASH_TAGLINE}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tagline: {
    fontSize: 14,
    marginTop: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
