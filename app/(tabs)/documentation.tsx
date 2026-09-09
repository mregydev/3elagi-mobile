import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { DocumentationVideoEmbed } from "@/components/documentation/DocumentationVideoEmbed";
import { DOCUMENTATION_VIDEOS } from "@/constants/documentationVideos";
import { surfaceCard, UI } from "@/constants/uiTokens";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { alignText } from "@/utils/rtl";

export default function DocumentationScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const textAlign = alignText(isRTL);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator>
        {DOCUMENTATION_VIDEOS.map((video) => (
          <View
            key={video.key}
            style={[styles.section, surfaceCard(colors.card, colors.border)]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}>
              {t.documentation[video.key]}
            </Text>
            <DocumentationVideoEmbed
              youtubeId={video.youtubeId}
              title={t.documentation[video.key]}
              height={280}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  section: {
    padding: 14,
    gap: 12,
    borderRadius: UI.radius.card,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
});
