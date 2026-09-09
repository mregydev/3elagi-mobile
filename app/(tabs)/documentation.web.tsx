import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DocumentationVideoEmbed } from "@/components/documentation/DocumentationVideoEmbed";
import { BRAND_SCROLL_NATIVE_ID } from "@/components/web/globalWebStyles";
import { DOCUMENTATION_VIDEOS } from "@/constants/documentationVideos";
import { surfaceCard, UI } from "@/constants/uiTokens";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { alignText } from "@/utils/rtl";

export default function DocumentationWebScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const textAlign = alignText(isRTL);

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView
        nativeID={BRAND_SCROLL_NATIVE_ID}
        contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
        showsVerticalScrollIndicator
      >
        <Text style={[styles.pageTitle, { color: colors.foreground, textAlign }]}>
          {t.documentation.title}
        </Text>

        {DOCUMENTATION_VIDEOS.map((video) => (
          <View
            key={video.key}
            style={[
              styles.section,
              surfaceCard(colors.card, colors.border),
              { borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}>
              {t.documentation[video.key]}
            </Text>
              <DocumentationVideoEmbed
                youtubeId={video.youtubeId}
                title={t.documentation[video.key]}
                height={isDesktop ? 520 : 280}
              />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: 0 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 16,
  },
  scrollDesktop: {
    paddingTop: 28,
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.35,
    marginBottom: 4,
  },
  section: {
    padding: 14,
    gap: 12,
    borderRadius: UI.radius.card,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.15,
  },
});
