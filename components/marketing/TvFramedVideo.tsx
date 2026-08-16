import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { HomeBannerVideo } from "@/components/HomeBannerVideo";
import { UI } from "@/constants/uiTokens";
import { useI18n } from "@/hooks/useI18n";

const PULSE_GREEN = "#22c55e";

/** Banner video in a TV set — bezel, screen, stand. Used by the public hero (desktop)
 *  and the mobile hero media section. */
export function TvFramedVideo({ animate = true }: { animate?: boolean }) {
  const { t, isRTL } = useI18n();

  // Slow 6s breathe — enough to catch the eye, not enough to distract.
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animate) return;
    const step = (toValue: number) =>
      Animated.timing(breathe, {
        toValue,
        duration: 3000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([step(1), step(0)]));
    loop.start();
    return () => loop.stop();
  }, [animate, breathe]);

  // "Live consultation" pulse: green glow + badge fade up, hold, fade out,
  // then a long quiet gap so it reads as occasional rather than blinking.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(3200),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(5000),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, pulse]);

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Animated.View
      style={[
        styles.set,
        {
          transform: [
            { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) },
            { translateY: breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
          ],
        },
      ]}
    >
      <View style={[styles.body, UI.shadowXl]}>
        <View style={styles.screen}>
          <HomeBannerVideo embedded />
        </View>
        <View style={styles.led} />

        {/* Green ring around the monitor — pointerEvents none so it never eats taps. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.pulseRing, { opacity: pulseOpacity }]}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.statusPill,
            isRTL ? styles.statusPillRTL : styles.statusPillLTR,
            {
              opacity: pulseOpacity,
              transform: [
                { translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{t.landing.doctorOnline}</Text>
        </Animated.View>
      </View>
      <View style={styles.neck} />
      <View style={styles.base} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  set: {
    width: "100%",
    alignItems: "center",
  },
  body: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: "#12161f",
    borderRadius: 20,
    padding: 14,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: "#2b3242",
  },
  screen: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  pulseRing: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: PULSE_GREEN,
    ...UI.shadowGlow,
  },
  statusPill: {
    position: "absolute",
    top: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(9, 14, 24, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.5)",
  },
  statusPillLTR: { right: 26 },
  statusPillRTL: { left: 26 },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: PULSE_GREEN,
  },
  statusText: {
    color: "#e8fff1",
    fontSize: 12,
    fontWeight: "700",
  },
  led: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  neck: {
    width: "12%",
    height: 26,
    backgroundColor: "#1c2230",
  },
  base: {
    width: "40%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#12161f",
  },
});
