import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Advertisement } from "@/domains/home/api";
import { localizeAdvertisement } from "@/domains/home/localizeAdvertisement";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 160;

interface Props {
  items: Advertisement[];
  isRTL: boolean;
}

export function AdvertisementCarousel({ items, isRTL }: Props) {
  const colors = useColors();
  const { locale } = useI18n();
  const listRef = useRef<FlatList<Advertisement>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % items.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 12));
    if (idx >= 0 && idx < items.length) setActiveIndex(idx);
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        pagingEnabled
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        inverted={isRTL}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + 12,
          offset: (CARD_WIDTH + 12) * index,
          index,
        })}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => {
          const localized = localizeAdvertisement(item, locale);
          return (
          <Pressable style={[styles.card, { width: CARD_WIDTH }]}>
            <Image
              source={{ uri: item.bannerImageUrl }}
              style={styles.banner}
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <Text style={styles.title} numberOfLines={1}>
                {localized.title}
              </Text>
              <Text style={styles.desc} numberOfLines={2}>
                {localized.description}
              </Text>
              {item.clinicName ? (
                <Text style={styles.clinic} numberOfLines={1}>
                  {item.clinicName}
                </Text>
              ) : null}
            </View>
          </Pressable>
          );
        }}
      />
      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((item, i) => (
            <View
              key={item.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIndex ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 12, paddingBottom: 4 },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  banner: { ...StyleSheet.absoluteFillObject },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "800" },
  desc: { color: "rgba(255,255,255,0.92)", fontSize: 13, marginTop: 4 },
  clinic: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginTop: 6,
    fontWeight: "600",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
