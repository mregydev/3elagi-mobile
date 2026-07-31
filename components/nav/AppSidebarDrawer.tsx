import { Menu, X } from "lucide-react-native";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppSidebarNav } from "@/components/nav/AppSidebarNav";
import { useAppSidebar } from "@/contexts/AppSidebarContext";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";

export function AppSidebarDrawer() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { open, closeSidebar } = useAppSidebar();
  const { isDesktop } = useWebLayout();

  // Desktop web keeps the permanent sidebar; drawer is for mobile (native + web).
  if (Platform.OS === "web" && isDesktop) return null;

  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent
      onRequestClose={closeSidebar}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={closeSidebar}
          accessibilityRole="button"
          accessibilityLabel={t.common.cancel}
        />
        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.card,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              [isRTL ? "right" : "left"]: 0,
              borderColor: colors.border,
              borderRightWidth: isRTL ? 0 : StyleSheet.hairlineWidth,
              borderLeftWidth: isRTL ? StyleSheet.hairlineWidth : 0,
              direction: isRTL ? "rtl" : "ltr",
            },
          ]}
          // @ts-expect-error web writing direction
          dir={isRTL ? "rtl" : "ltr"}
        >
          <View
            style={[
              styles.closeRow,
              { justifyContent: isRTL ? "flex-start" : "flex-end" },
            ]}
          >
            <Pressable
              onPress={closeSidebar}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t.common.cancel}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: pressed ? colors.muted : "transparent" },
              ]}
            >
              <X size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.navHost}>
            <AppSidebarNav onNavigate={closeSidebar} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Menu button for AppHeader — opens the side drawer on mobile. */
export function AppSidebarMenuButton() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { openSidebar } = useAppSidebar();
  const { isDesktop } = useWebLayout();

  if (Platform.OS === "web" && isDesktop) return null;

  return (
    <Pressable
      onPress={openSidebar}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={t.tabs.menu}
      style={({ pressed }) => [
        styles.menuBtn,
        {
          [isRTL ? "right" : "left"]: 12,
          backgroundColor: pressed ? colors.muted : "transparent",
        },
      ]}
    >
      <Menu size={22} color={colors.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 300,
    maxWidth: "86%",
    zIndex: 2,
    overflow: "hidden",
  },
  navHost: {
    flex: 1,
    minHeight: 0,
  },
  closeRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuBtn: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    zIndex: 2,
  },
});
