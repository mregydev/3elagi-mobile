import React, { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useWebLayout } from "@/hooks/useWebLayout";

// Metro resolves this to a public URL string on web.
const BANNER_VIDEO = require("../assets/banner_video.mp4") as string | number;

/** Design frame — video is stretched to this 1200×320 box (nothing cropped). */
const BANNER_W = 1200;
const BANNER_H = 320;
const BANNER_RATIO = BANNER_H / BANNER_W;

/** Home hero (web): local looping muted banner video (replaces ad image carousel). */
export function HomeBannerVideo() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const { isDesktop } = useWebLayout();

  const horizontalPadding = isDesktop ? 24 : 16;
  const bannerWidth = Math.max(280, width - horizontalPadding * 2);
  const bannerHeight = Math.max(
    Math.round(bannerWidth * BANNER_RATIO),
    isDesktop ? BANNER_H : 0,
  );

  const src = useMemo(() => {
    if (typeof BANNER_VIDEO === "string") return BANNER_VIDEO;
    return String(BANNER_VIDEO);
  }, []);

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
        {React.createElement("video", {
          src,
          autoPlay: true,
          muted: true,
          loop: true,
          playsInline: true,
          style: {
            width: "100%",
            height: "100%",
            // Fill banner width + height exactly (no crop).
            objectFit: "fill",
            display: "block",
          },
          "aria-label": "3elagi banner",
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  hero: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
});
