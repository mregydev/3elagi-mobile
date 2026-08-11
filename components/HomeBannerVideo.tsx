import { ResizeMode, Video } from "expo-av";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const BANNER_VIDEO = require("../assets/banner_video.mp4");
/** Design frame for stretch; height is floored at 30% of the viewport on native. */
const BANNER_W = 1200;
const BANNER_H = 320;
const BANNER_RATIO = BANNER_H / BANNER_W;
const MIN_VIEWPORT_FRACTION = 0.3;

/** Home hero: local looping muted banner video (replaces ad image carousel). */
export function HomeBannerVideo() {
  const colors = useColors();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const videoRef = useRef<Video>(null);

  // Navigating away pauses the player, and `shouldPlay` alone does not restart
  // it on the way back — the banner came back as a frozen/blank frame.
  useFocusEffect(
    useCallback(() => {
      const video = videoRef.current;
      void video?.playAsync().catch(() => undefined);
      return () => {
        void videoRef.current?.pauseAsync().catch(() => undefined);
      };
    }, []),
  );

  const horizontalPadding = 16;
  const bannerWidth = Math.max(280, windowWidth - horizontalPadding * 2);
  const ratioHeight = Math.round(bannerWidth * BANNER_RATIO);
  // Native mobile: keep the banner tall enough to notice ( ≥ 30% of viewport ).
  const bannerHeight = Math.max(
    ratioHeight,
    Math.round(windowHeight * MIN_VIEWPORT_FRACTION),
  );

  return (
    <View style={[styles.wrap, { paddingHorizontal: horizontalPadding }]}>
      <View
        style={[
          styles.hero,
          {
            width: "100%",
            height: bannerHeight,
            borderColor: colors.border,
            backgroundColor: colors.muted,
          },
        ]}
      >
        <Video
          ref={videoRef}
          source={BANNER_VIDEO}
          style={styles.video}
          // Stretch to banner width + height so no edges are cropped.
          resizeMode={ResizeMode.STRETCH}
          shouldPlay
          isLooping
          isMuted
          volume={0}
          useNativeControls={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, paddingBottom: 4 },
  hero: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
