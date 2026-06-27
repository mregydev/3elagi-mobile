import { Image } from "expo-image";
import { X } from "lucide-react-native";
import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ANDROID_APP_QR } from "@/constants/mobileApp";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { alignText } from "@/utils/rtl";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function MobileAppDownloadModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const textAlign = alignText(isRTL);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
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
            {t.mobileApp.modalSubtitle}
          </Text>

          <View style={styles.qrWrap}>
            <Image
              source={ANDROID_APP_QR}
              style={styles.qr}
              contentFit="contain"
              accessibilityLabel={t.mobileApp.qrAlt}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
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
          zIndex: 1000,
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
  qrWrap: {
    alignSelf: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  qr: {
    width: 200,
    height: 200,
  },
});
