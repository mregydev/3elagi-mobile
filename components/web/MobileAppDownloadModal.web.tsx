import { X } from "lucide-react-native";
import React, { createElement } from "react";
import {
  Image as RNImage,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ANDROID_APP_QR,
  ANDROID_APP_QR_SIZE,
  ANDROID_APP_QR_URI,
  ANDROID_APP_URL,
} from "@/constants/mobileApp";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { alignText } from "@/utils/rtl";
import { viewportPortal } from "@/utils/viewportPortal";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function WebQrImage({ alt }: { alt: string }) {
  const { width, height } = ANDROID_APP_QR_SIZE;
  const src = ANDROID_APP_QR_URI;

  if (!src) {
    return (
      <RNImage
        source={ANDROID_APP_QR}
        style={{ width, height }}
        accessibilityLabel={alt}
        resizeMode="contain"
      />
    );
  }

  // Native <img> is the most reliable path on mobile browsers (Safari/Chrome).
  return createElement("img", {
    src,
    alt,
    width,
    height,
    decoding: "async",
    style: {
      objectFit: "contain",
      display: "block",
      width,
      height,
      maxWidth: "100%",
    },
  });
}

function QrCodeImage({ alt }: { alt: string }) {
  const { width, height } = ANDROID_APP_QR_SIZE;

  if (Platform.OS === "web") {
    return <WebQrImage alt={alt} />;
  }

  return (
    <RNImage
      source={ANDROID_APP_QR}
      style={{ width, height }}
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

  if (!visible) return null;

  const openDownload = () => {
    void Linking.openURL(ANDROID_APP_URL).catch(() => undefined);
  };

  const qrBlock = (
    <View style={[styles.qrWrap, { borderColor: colors.border }]}>
      <QrCodeImage alt={t.mobileApp.qrAlt} />
    </View>
  );

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
            {isMobile ? t.mobileApp.mobileWebSubtitle : t.mobileApp.modalSubtitle}
          </Text>

          {isMobile ? (
            <Pressable
              onPress={openDownload}
              accessibilityRole="link"
              accessibilityLabel={t.mobileApp.openLink}
              style={({ pressed }) => [pressed && styles.qrPressed]}
            >
              {qrBlock}
            </Pressable>
          ) : (
            qrBlock
          )}

          {isMobile ? (
            <Pressable
              onPress={openDownload}
              accessibilityRole="link"
              accessibilityLabel={t.mobileApp.openLink}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.openLinkBtn,
                {
                  borderColor: colors.primary,
                  backgroundColor: pressed || hovered ? `${colors.primary}12` : "transparent",
                },
              ]}
            >
              <Text style={[styles.openLinkText, { color: colors.primary, textAlign }]}>
                {t.mobileApp.openLink}
              </Text>
            </Pressable>
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
    maxWidth: 360,
    flexGrow: 0,
  },
  dialogScrollMobile: {
    maxHeight: "92%",
    width: "100%",
    maxWidth: 340,
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
  qrWrap: {
    alignSelf: "center",
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  qrPressed: {
    opacity: 0.92,
  },
  openLinkBtn: {
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    cursor: "pointer" as "auto",
  },
  openLinkText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
