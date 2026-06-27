import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthLanguageField } from "@/components/auth/AuthLanguageField";
import { Logo3elagi } from "@/components/Logo3elagi";
import { MobileAppLink } from "@/components/web/MobileAppLink.web";
import { LOGO_HEIGHT } from "@/constants/brand";
import { WebAuthBackground } from "@/components/web/WebAuthBackground";
import {
  WEB_MAX_WIDTH,
  WEB_MOBILE_AUTH_EXTRA_BOTTOM_PADDING,
  WEB_MOBILE_AUTH_EXTRA_TOP_PADDING,
  WEB_MOBILE_AUTH_LOGIN_FLAGS_EXTRA_TOP_MARGIN,
  WEB_MOBILE_AUTH_SIGNUP_EXTRA_BOTTOM_PADDING,
} from "@/constants/webLayout";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useMobileWebPageTitlePaddingTop } from "@/hooks/useMobileWebPageTitlePaddingTop";
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
  backgroundVariant?: "gradient" | "login-hero";
  heroOverlayOpacity?: number;
}

export function WebAuthFrame({
  children,
  eyebrow,
  headline,
  description,
  scrollForm = false,
  backgroundVariant = "gradient",
  heroOverlayOpacity = 0.22,
}: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop, isMobile, isTablet, isWide } = useWebLayout();
  const mobileTitlePaddingTop = useMobileWebPageTitlePaddingTop();
  const textAlign = isRTL ? "right" : "left";

  const panelWidth = isWide
    ? WEB_MAX_WIDTH.wide
    : isDesktop
      ? WEB_MAX_WIDTH.content
      : isTablet
        ? 760
        : "100%";

  const pagePadding = isMobile ? 16 : isTablet ? 24 : 32;

  return (
    <WebAuthBackground variant={backgroundVariant} heroOverlayOpacity={heroOverlayOpacity}>
      <View style={[styles.page, scrollForm && styles.pageForm]}>
        <View
          style={[
            styles.scrollBody,
            scrollForm && styles.scrollBodyForm,
            {
              paddingHorizontal: pagePadding,
              paddingBottom:
                isMobile && scrollForm
                  ? 16 + WEB_MOBILE_AUTH_SIGNUP_EXTRA_BOTTOM_PADDING
                  : isMobile
                    ? 16 + WEB_MOBILE_AUTH_EXTRA_BOTTOM_PADDING
                    : 24,
              paddingTop: isMobile
                ? mobileTitlePaddingTop + WEB_MOBILE_AUTH_EXTRA_TOP_PADDING
                : 24,
            },
          ]}
        >
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
              isMobile && styles.pageTopBarMobile,
              isMobile &&
                !scrollForm && {
                  marginTop: WEB_MOBILE_AUTH_LOGIN_FLAGS_EXTRA_TOP_MARGIN,
                },
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
            <View style={[styles.pageTopActions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <MobileAppLink variant="toolbar" />
              <AuthLanguageField />
            </View>
          </View>

          <View
            style={[
              styles.panel,
              isDesktop && !scrollForm && styles.panelDesktop,
              scrollForm && styles.panelForm,
              isMobile && styles.panelMobile,
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
                  isMobile && styles.eyebrowMobile,
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
    gap: 8,
  },
  pageTopBarMobile: {
    paddingBottom: 12,
    marginBottom: 8,
  },
  pageTopActions: {
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
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
  panelMobile: {
    borderRadius: 16,
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
  eyebrowMobile: {
    paddingTop: 20,
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
