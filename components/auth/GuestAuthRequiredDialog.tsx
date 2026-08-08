import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { LogIn, UserPlus, X } from "lucide-react-native";
import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useGuestAuthDialogStore } from "@/domains/auth/guestAuthDialogStore";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { alignText, flexRow } from "@/utils/rtl";

/** Design-system dialog prompting guests to log in or sign up (welcome CTA buttons). */
export function GuestAuthRequiredDialog() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const visible = useGuestAuthDialogStore((s) => s.visible);
  const close = useGuestAuthDialogStore((s) => s.close);
  const textAlign = alignText(isRTL);
  const dir = flexRow(isRTL);

  const goLogin = () => {
    close();
    router.push("/auth/login");
  };

  const goSignup = () => {
    close();
    router.push("/auth/signup");
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={close}>
      <View style={styles.overlay} accessibilityViewIsModal>
        <Pressable
          style={styles.backdrop}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={t.common.cancel}
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
          <View style={[styles.header, { flexDirection: dir }]}>
            <Text style={[styles.title, { color: colors.foreground, textAlign }]}>
              {t.auth.guestAuthRequiredTitle}
            </Text>
            <Pressable
              onPress={close}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={t.common.cancel}
              hitSlop={8}
            >
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign }]}>
            {t.auth.guestAuthRequiredMessage}
          </Text>

          <Pressable
            onPress={goLogin}
            style={({ pressed }) => [
              styles.btnPrimary,
              { opacity: pressed ? 0.92 : 1, shadowColor: "#3057F2" },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.auth.logIn}
          >
            <LinearGradient
              colors={["#3057F2", "#1B9AAA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.btnPrimaryGradient, { flexDirection: dir }]}
            >
              <LogIn size={18} color="#fff" />
              <Text style={styles.btnPrimaryText}>{t.auth.logIn}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={goSignup}
            style={({ pressed }) => [
              styles.btnGhost,
              {
                borderColor: "#3057F2",
                backgroundColor: pressed
                  ? "rgba(48,87,242,0.16)"
                  : "rgba(48,87,242,0.08)",
                flexDirection: dir,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.auth.newMemberSignUp}
          >
            <UserPlus size={18} color="#1D4ED8" />
            <Text style={[styles.btnGhostText, { color: "#1D4ED8" }]}>
              {t.auth.newMemberSignUp}
            </Text>
          </Pressable>

          <Pressable
            onPress={close}
            style={({ pressed }) => [styles.btnCancel, { opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={t.common.cancel}
          >
            <Text style={[styles.btnCancelText, { color: colors.mutedForeground }]}>
              {t.common.cancel}
            </Text>
          </Pressable>
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
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    marginHorizontal: 8,
  },
  header: {
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
    lineHeight: 21,
    marginBottom: 4,
  },
  btnPrimary: {
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 8,
    cursor: "pointer" as "auto",
  },
  btnPrimaryGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  btnGhost: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    cursor: "pointer" as "auto",
  },
  btnGhostText: {
    fontWeight: "800",
    fontSize: 16,
  },
  btnCancel: {
    paddingVertical: 8,
    alignItems: "center",
    cursor: "pointer" as "auto",
  },
  btnCancelText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
