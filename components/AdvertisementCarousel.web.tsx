import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { Advertisement } from "@/domains/home/api";
import { localizeAdvertisement } from "@/domains/home/localizeAdvertisement";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";

interface Props {
  items: Advertisement[];
  isRTL: boolean;
}

export function AdvertisementCarousel({ items, isRTL }: Props) {
  const colors = useColors();
  const { locale } = useI18n();
  const { width } = useWindowDimensions();
  const { isDesktop, isTablet } = useWebLayout();
  const [activeIndex, setActiveIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const horizontalPadding = isDesktop ? 24 : 16;
  const bannerWidth = Math.max(280, width - horizontalPadding * 2);
  const bannerHeight = isDesktop
    ? Math.round(Math.min(320, Math.max(220, bannerWidth * 0.26)))
    : isTablet
      ? 200
      : 168;

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length || index === activeIndex) return;

      Animated.timing(fade, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setActiveIndex(index);
        Animated.timing(fade, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      });
    },
    [activeIndex, fade, items.length],
  );

  const goNext = useCallback(() => {
    goTo((activeIndex + 1) % items.length);
  }, [activeIndex, goTo, items.length]);

  const goPrev = useCallback(() => {
    goTo((activeIndex - 1 + items.length) % items.length);
  }, [activeIndex, goTo, items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [goNext, items.length]);

  if (items.length === 0) return null;

  const item = items[activeIndex];
  const localized = localizeAdvertisement(item, locale);
  const showControls = items.length > 1;
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <View style={[styles.wrap, { paddingHorizontal: horizontalPadding }]}>
      <View
        style={[
          styles.hero,
          {
            height: bannerHeight,
            borderColor: colors.border,
            backgroundColor: colors.muted,
          },
        ]}
      >
        <Animated.View style={[styles.slide, { opacity: fade }]}>
          <Image
            source={{ uri: item.bannerImageUrl }}
            style={styles.banner}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.82)"]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={[
              styles.copy,
              {
                alignItems: isRTL ? "flex-end" : "flex-start",
                paddingHorizontal: isDesktop ? 28 : 18,
                paddingBottom: isDesktop ? 24 : 16,
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                {
                  fontSize: isDesktop ? 24 : isTablet ? 20 : 17,
                  textAlign: isRTL ? "right" : "left",
                  maxWidth: isDesktop ? "72%" : "100%",
                },
              ]}
              numberOfLines={isDesktop ? 2 : 1}
            >
              {localized.title}
            </Text>
            <Text
              style={[
                styles.desc,
                { textAlign: isRTL ? "right" : "left", maxWidth: isDesktop ? "68%" : "100%" },
              ]}
              numberOfLines={isDesktop ? 3 : 2}
            >
              {localized.description}
            </Text>
            {item.clinicName ? (
              <Text
                style={[
                  styles.clinic,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
                numberOfLines={1}
              >
                {item.clinicName}
              </Text>
            ) : null}
          </View>
        </Animated.View>

        {showControls ? (
          <>
            <Pressable
              onPress={goPrev}
              accessibilityLabel="Previous slide"
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.arrow,
                isRTL ? styles.arrowRight : styles.arrowLeft,
                {
                  backgroundColor:
                    pressed || hovered ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.16)",
                },
              ]}
            >
              <PrevIcon size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={goNext}
              accessibilityLabel="Next slide"
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.arrow,
                isRTL ? styles.arrowLeft : styles.arrowRight,
                {
                  backgroundColor:
                    pressed || hovered ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.16)",
                },
              ]}
            >
              <NextIcon size={20} color="#fff" />
            </Pressable>
          </>
        ) : null}
      </View>

      {showControls ? (
        <View style={[styles.footer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <View style={[styles.dots, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {items.map((ad, i) => {
              const active = i === activeIndex;
              return (
                <Pressable
                  key={ad.id}
                  onPress={() => goTo(i)}
                  accessibilityLabel={`Go to slide ${i + 1}`}
                  style={[
                    styles.dot,
                    {
                      width: active ? 22 : 8,
                      backgroundColor: active ? colors.primary : colors.border,
                    },
                  ]}
                />
              );
            })}
          </View>
          <Text style={[styles.counter, { color: colors.mutedForeground }]}>
            {activeIndex + 1}/{items.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  hero: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  slide: {
    ...StyleSheet.absoluteFillObject,
  },
  banner: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  copy: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 48,
    gap: 6,
  },
  title: {
    color: "#fff",
    fontWeight: "800",
    lineHeight: 28,
  },
  desc: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    lineHeight: 20,
  },
  clinic: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },
  footer: {
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  dots: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  counter: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 36,
    textAlign: "right",
  },
});
