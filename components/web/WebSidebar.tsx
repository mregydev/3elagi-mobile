import React from "react";
import { StyleSheet, View } from "react-native";
import { AppSidebarNav } from "@/components/nav/AppSidebarNav";
import { MobileAppLink } from "@/components/web/MobileAppLink";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";

export function WebSidebar() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const { isDesktop } = useWebLayout();

  if (!isDesktop) return null;

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRightWidth: isRTL ? 0 : StyleSheet.hairlineWidth,
          borderLeftWidth: isRTL ? StyleSheet.hairlineWidth : 0,
        },
      ]}
    >
      <AppSidebarNav footerExtra={<MobileAppLink variant="nav" />} />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 248,
    height: "100%",
  },
});
