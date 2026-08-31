import { Download, X } from "lucide-react-native";
import React, { createElement, useEffect, useState } from "react";
import {
  Image as RNImage,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ANDROID_APP_URL,
  ANDROID_INSTALL_PROMPT,
  ANDROID_INSTALL_PROMPT_SIZE,
  ANDROID_INSTALL_PROMPT_URI,
} from "@/constants/mobileApp";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { alignText } from "@/utils/rtl";
import { openAndroidAppDownload } from "@/utils/openAndroidAppDownload";
import { viewportPortal } from "@/utils/viewportPortal";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function InstallPromptImage({ alt }: { alt: string }) {
  const { width, height } = ANDROID_INSTALL_PROMPT_SIZE;
  const src = ANDROID_INSTALL_PROMPT_URI;

  if (Platform.OS === "web" && src) {
    return createElement("img", {
      src,
      alt,
      width,
      height,
      decoding: "async",
      style: {
        objectFit: "contain",
        display: "block",
        width: "100%",
        maxWidth: width,
        height: "auto",
        borderRadius: 12,
      },
    });
  }

  return (
    <RNImage
      source={ANDROID_INSTALL_PROMPT}
      style={{ width, height, borderRadius: 12 }}
      accessibilityLabel={alt}
      resizeMode="contain"
    />
  );
}

export function MobileAppDownloadModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isMobile } = useWebLayout();
  const textAlign = alignText(isRTL);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    if (!visible) setDownloadStarted(false);
  }, [visible]);

  if (!visible) return null;

  const startDownload = () => {
    setDownloadStarted(true);
    openAndroidAppDownload();
  };

  const content = (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t.mobileApp.close}
      />
      <ScrollView
        style={[styles.dialogScroll, isMobile && styles.dialogScrollMobile]}
        contentContainerStyle={styles.dialogScrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={isMobile}
      >
        <View
          style={[
            styles.dialog,
            isMobile && styles.dialogMobile,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground, textAlign }]}>
              {t.mobileApp.modalTitle}
            </Text>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={t.mobileApp.close}
            >
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign }]}>
            {t.mobileApp.modalSubtitle}
          </Text>

          <Pressable
            onPress={startDownload}
            accessibilityRole="link"
            accessibilityLabel={t.mobileApp.downloadButton}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.downloadBtn,
              {
                backgroundColor:
                  pressed || hovered ? `${colors.primary}e6` : colors.primary,
              },
            ]}
          >
            <Download size={18} color={colors.primaryForeground} />
            <Text style={[styles.downloadBtnText, { color: colors.primaryForeground, textAlign }]}>
              {t.mobileApp.downloadButton}
            </Text>
          </Pressable>

          {downloadStarted ? (
            <View style={[styles.installBlock, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <Text style={[styles.installTitle, { color: colors.foreground, textAlign }]}>
                {t.mobileApp.installTitle}
              </Text>
              <Text style={[styles.installHint, { color: colors.mutedForeground, textAlign }]}>
                {t.mobileApp.installHint}
              </Text>
              <View style={[styles.installImageWrap, { borderColor: colors.border }]}>
                <InstallPromptImage alt={t.mobileApp.installImageAlt} />
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );

  return viewportPortal(content);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    ...(Platform.OS === "web"
      ? ({
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
        } as object)
      : null),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialogScroll: {
    width: "100%",
    maxWidth: 400,
    flexGrow: 0,
  },
  dialogScrollMobile: {
    maxHeight: "92%",
    width: "100%",
    maxWidth: 360,
  },
  dialogScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  dialog: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    marginHorizontal: 8,
  },
  dialogMobile: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  closeBtn: {
    padding: 4,
    cursor: "pointer" as "auto",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    alignSelf: "stretch",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    cursor: "pointer" as "auto",
  },
  downloadBtnText: {
    fontSize: 16,
    fontWeight: "800",
  },
  installBlock: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  installTitle: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  installHint: {
    fontSize: 13,
    lineHeight: 19,
  },
  installImageWrap: {
    alignSelf: "center",
    width: "100%",
    maxWidth: ANDROID_INSTALL_PROMPT_SIZE.width,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    padding: 8,
  },
});
