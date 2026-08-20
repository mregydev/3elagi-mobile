import React from "react";
import { StyleSheet, View } from "react-native";
import { PublicHeroMediaSection } from "@/components/marketing/PublicHeroMediaSection";
import { TvFramedVideo } from "@/components/marketing/TvFramedVideo";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { flexRow } from "@/utils/rtl";

interface Props {
  children: React.ReactNode;
}

/** Signed-in home hero: dashboard copy beside (desktop) or above (mobile) the TV banner video. */
export function HomeHeroWithTvVideo({ children }: Props) {
  const { isDesktop } = useWebLayout();
  const { isRTL } = useI18n();
  const dir = flexRow(isRTL);

  if (isDesktop) {
    return (
      <View style={[styles.shellDesktop, { flexDirection: dir }]}>
        <View style={styles.copyDesktop}>{children}</View>
        <View style={styles.visualDesktop}>
          <TvFramedVideo />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.shellMobile}>
      {children}
      <PublicHeroMediaSection />
    </View>
  );
}

const styles = StyleSheet.create({
  shellDesktop: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    alignItems: "center",
    gap: 48,
  },
  copyDesktop: {
    flex: 5,
    minWidth: 300,
    minHeight: 0,
  },
  visualDesktop: {
    flex: 7,
    minWidth: 380,
  },
  shellMobile: {
    gap: 4,
  },
});
