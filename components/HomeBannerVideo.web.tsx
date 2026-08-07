import React, { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useWebLayout } from "@/hooks/useWebLayout";

// Metro resolves this to a public URL string on web.
const BANNER_VIDEO = require("../assets/banner_video.mp4") as string | number;

/** Design frame — video is stretched to fill; mobile web floors at 30% viewport. */
const BANNER_W = 1200;
const BANNER_H = 320;
const BANNER_RATIO = BANNER_H / BANNER_W;
const MIN_VIEWPORT_FRACTION = 0.3;

/** Home hero (web): local looping muted banner video (replaces ad image carousel). */
export function HomeBannerVideo() {
  const colors = useColors();
  const { width, height: windowHeight } = useWindowDimensions();
  const { isDesktop } = useWebLayout();

  const horizontalPadding = isDesktop ? 24 : 16;
  const bannerWidth = Math.max(280, width - horizontalPadding * 2);
  const ratioHeight = Math.round(bannerWidth * BANNER_RATIO);
  // Mobile web: match native — keep the banner ≥ 30% of the viewport.
  const bannerHeight = Math.max(
    ratioHeight,
    isDesktop ? BANNER_H : Math.round(windowHeight * MIN_VIEWPORT_FRACTION),
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
