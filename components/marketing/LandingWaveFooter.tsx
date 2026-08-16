import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

/** One period is 1440 wide; the path below draws two so it can loop seamlessly. */
const PERIOD = 1440;
const VIEWBOX_HEIGHT = 220;

/** Two identical crests — translating by exactly one period lands on the same
 *  shape, so the loop has no visible seam. */
function wavePath(crest: number, trough: number, base: number): string {
  const half = PERIOD / 2;
  const seg = (x: number) =>
    `C ${x + half / 3} ${crest} ${x + (half * 2) / 3} ${crest} ${x + half} ${base}` +
    ` C ${x + half + half / 3} ${trough} ${x + half + (half * 2) / 3} ${trough} ${x + PERIOD} ${base}`;
  return `M0 ${base} ${seg(0)} ${seg(PERIOD)} L${PERIOD * 2} ${VIEWBOX_HEIGHT} L0 ${VIEWBOX_HEIGHT} Z`;
}

const LAYERS = [
  { id: "wave-back", d: wavePath(56, 150, 104), opacity: 0.22, duration: 34000 },
  { id: "wave-mid", d: wavePath(104, 178, 140), opacity: 0.3, duration: 25000 },
  { id: "wave-front", d: wavePath(150, 200, 174), opacity: 0.42, duration: 17000 },
];

/** Glassy water band closing the landing page — translucent crests drifting
 *  sideways at different speeds, which reads as a slow current. */
export function LandingWaveFooter() {
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const height = Math.round(Math.min(200, Math.max(120, width * (VIEWBOX_HEIGHT / PERIOD) * 1.6)));

  // One driver per layer; each runs 0 → 1 forever and maps to a full period.
  const drivers = useRef(LAYERS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!width) return;
    const loops = drivers.map((driver, index) =>
      Animated.loop(
        Animated.timing(driver, {
          toValue: 1,
          duration: LAYERS[index].duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [drivers, width]);

  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      pointerEvents="none"
    >
      {width
        ? LAYERS.map((layer, index) => (
            <Animated.View
              key={layer.id}
              style={[
                styles.layer,
                {
                  width: width * 2,
                  transform: [
                    {
                      translateX: drivers[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -width],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${PERIOD * 2} ${VIEWBOX_HEIGHT}`}
                preserveAspectRatio="none"
              >
                <Defs>
                  {/* Glass: near-transparent at the crest, tinted at the base. */}
                  <LinearGradient id={layer.id} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#ffffff" stopOpacity={0.55} />
                    <Stop offset="0.45" stopColor={colors.primary} stopOpacity={0.35} />
                    <Stop offset="1" stopColor={colors.primary} stopOpacity={0.85} />
                  </LinearGradient>
                </Defs>
                <Path d={layer.d} fill={`url(#${layer.id})`} opacity={layer.opacity} />
              </Svg>
            </Animated.View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginTop: 24,
    overflow: "hidden",
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    right: undefined,
  },
});
