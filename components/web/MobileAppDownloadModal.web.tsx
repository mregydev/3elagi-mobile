import { Image } from "expo-image";
import { X } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ANDROID_APP_QR } from "@/constants/mobileApp";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { openAndroidAppDownload } from "@/utils/openAndroidAppDownload";
import { alignText } from "@/utils/rtl";
import { viewportPortal } from "@/utils/viewportPortal";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function MobileAppDownloadModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const textAlign = alignText(isRTL);

  if (!visible) return null;

  const content = (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t.mobileApp.close}
      />
      <View
        style={[
          styles.dialog,
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
          {isDesktop ? t.mobileApp.modalSubtitle : t.mobileApp.mobileWebSubtitle}
        </Text>

        <Pressable
          onPress={openAndroidAppDownload}
          accessibilityRole="link"
          accessibilityLabel={t.mobileApp.openLink}
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
            styles.downloadBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed || hovered ? 0.9 : 1,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.downloadBtnText}>{t.mobileApp.openLink}</Text>
        </Pressable>

        <View style={[styles.qrWrap, { borderColor: colors.border }]}>
          <Image
            source={ANDROID_APP_QR}
            style={styles.qr}
            contentFit="contain"
            accessibilityLabel={t.mobileApp.qrAlt}
          />
        </View>
      </View>
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
  dialog: {
    width: "100%",
    maxWidth: 360,
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
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    cursor: "pointer" as "auto",
  },
  downloadBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  qrWrap: {
    alignSelf: "center",
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  qr: {
    width: 220,
    aspectRatio: 552 / 536,
  },
});
