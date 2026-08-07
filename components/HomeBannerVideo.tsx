import { ResizeMode, Video } from "expo-av";
import React, { useRef } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const BANNER_VIDEO = require("../assets/banner_video.mp4");
/** Design frame — video is stretched to this 1200×320 box (nothing cropped). */
const BANNER_W = 1200;
const BANNER_H = 320;
const BANNER_RATIO = BANNER_H / BANNER_W;

/** Home hero: local looping muted banner video (replaces ad image carousel). */
export function HomeBannerVideo() {
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const videoRef = useRef<Video>(null);

  const horizontalPadding = 16;
  const bannerWidth = Math.max(280, windowWidth - horizontalPadding * 2);
  const bannerHeight = Math.round(bannerWidth * BANNER_RATIO);

  return (
    <View style={[styles.wrap, { paddingHorizontal: horizontalPadding }]}>
      <View
        style={[
          styles.hero,
          {
            width: "100%",
            height: bannerHeight,
            aspectRatio: BANNER_W / BANNER_H,
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
  wrap: { paddingTop: 12, paddingBottom: 4 },
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
