import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthLanguageField } from "@/components/auth/AuthLanguageField";
import { Logo3elagi } from "@/components/Logo3elagi";
import { LOGO_HEIGHT } from "@/constants/brand";
import { WebAuthBackground } from "@/components/web/WebAuthBackground";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";

interface Props {
  children: React.ReactNode;
  /** Shown on the desktop brand panel and as a page eyebrow on smaller web viewports. */
  eyebrow?: string;
  /** Desktop brand panel headline. */
  headline?: string;
  /** Desktop brand panel description. */
  description?: string;
  /** Scroll inside the form column only (viewport-height cap). Used on signup. */
  scrollForm?: boolean;
}

export function WebAuthFrame({
  children,
  eyebrow,
  headline,
  description,
  scrollForm = false,
}: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop, isTablet, isWide } = useWebLayout();
  const textAlign = isRTL ? "right" : "left";

  const panelWidth = isWide
    ? WEB_MAX_WIDTH.wide
    : isDesktop
      ? WEB_MAX_WIDTH.content
      : isTablet
        ? 760
        : "100%";

  return (
    <WebAuthBackground>
      <View style={[styles.page, scrollForm && styles.pageForm]}>
        <View style={[styles.scrollBody, scrollForm && styles.scrollBodyForm]}>
        <View
          style={[
            styles.center,
            scrollForm && styles.centerScrollForm,
            { maxWidth: panelWidth },
          ]}
        >
          <View
            style={[
              styles.pageTopBar,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel={t.auth.goBack}
            >
              <ArrowLeft size={22} color={colors.foreground} />
            </Pressable>
            <AuthLanguageField />
          </View>

          <View
            style={[
              styles.panel,
              isDesktop && !scrollForm && styles.panelDesktop,
              scrollForm && styles.panelForm,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                flexDirection: isDesktop ? (isRTL ? "row-reverse" : "row") : "column",
              },
            ]}
          >
            {isDesktop ? (
              <View
                style={[
                  styles.brandPane,
                  {
                    backgroundColor: `${colors.primary}10`,
                    borderColor: colors.border,
                    borderRightWidth: isRTL ? 0 : StyleSheet.hairlineWidth,
                    borderLeftWidth: isRTL ? StyleSheet.hairlineWidth : 0,
                  },
                ]}
              >
                <Logo3elagi height={LOGO_HEIGHT.authPanel} />
                {headline ? (
                  <Text style={[styles.headline, { color: colors.foreground, textAlign }]}>
                    {headline}
                  </Text>
                ) : null}
                {description ? (
                  <Text
                    style={[
                      styles.description,
                      { color: colors.mutedForeground, textAlign },
                    ]}
                  >
                    {description}
                  </Text>
                ) : null}
              </View>
            ) : eyebrow ? (
              <Text
                style={[
                  styles.eyebrow,
                  {
                    color: colors.mutedForeground,
                    textAlign: "center",
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                {eyebrow}
              </Text>
            ) : null}

            <View
              nativeID={scrollForm ? "auth-form-scroll" : undefined}
              style={[styles.formPane, scrollForm && styles.formPaneScroll]}
            >
              {children}
            </View>
          </View>
        </View>
      </View>
      </View>
    </WebAuthBackground>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    overflow: "auto" as "scroll",
  },
  pageForm: {
    overflow: "hidden",
  },
  scrollBody: {
    minHeight: "100%",
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  scrollBodyForm: {
    height: "100%",
    maxHeight: "100vh" as unknown as number,
    overflow: "hidden",
    justifyContent: "center",
    flexDirection: "column",
  },
  center: {
    width: "100%",
  },
  centerScrollForm: {
    flex: 1,
    minHeight: 0,
    gap: 12,
  },
  pageTopBar: {
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  backBtn: {
    padding: 6,
  },
  panel: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  panelDesktop: {
    minHeight: 720,
  },
  panelForm: {
    flex: 1,
    minHeight: 0,
    maxHeight: "100%" as unknown as number,
  },
  brandPane: {
    flex: 1,
    paddingHorizontal: 48,
    paddingVertical: 48,
    justifyContent: "center",
    gap: 16,
    minWidth: 360,
  },
  headline: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 420,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  formPane: {
    flex: 1,
    width: "100%",
    minWidth: 0,
  },
  formPaneScroll: {
    minHeight: 0,
    overflow: "auto" as "scroll",
  },
});
