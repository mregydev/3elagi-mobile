import { Image } from "expo-image";
import { X } from "lucide-react-native";
import React from "react";
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
  ANDROID_APP_QR,
  ANDROID_APP_QR_SIZE,
  ANDROID_APP_QR_URI,
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

function QrCodeImage({ alt }: { alt: string }) {
  const { width, height } = ANDROID_APP_QR_SIZE;

  // Mobile browsers often fail to paint expo-image for bundled PNGs — use <img>.
  if (Platform.OS === "web" && ANDROID_APP_QR_URI) {
    return (
      <RNImage
        source={{ uri: ANDROID_APP_QR_URI }}
        style={{ width, height }}
        accessibilityLabel={alt}
        resizeMode="contain"
      />
    );
  }

  return (
    <Image
      source={ANDROID_APP_QR}
      style={{ width, height }}
      contentFit="contain"
      accessibilityLabel={alt}
    />
  );
}

export function MobileAppDownloadModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isMobile } = useWebLayout();
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
      <ScrollView
        style={[styles.dialogScroll, isMobile && styles.dialogScrollMobile]}
        contentContainerStyle={styles.dialogScrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
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
            {t.mobileApp.modalSubtitle}
          </Text>

          <View style={[styles.qrWrap, { borderColor: colors.border }]}>
            <QrCodeImage alt={t.mobileApp.qrAlt} />
          </View>
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
    maxHeight: "90%",
  },
  dialogScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
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
});
