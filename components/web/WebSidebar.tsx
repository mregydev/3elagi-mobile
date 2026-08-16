import React, { useState } from "react";
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
  const [collapsed, setCollapsed] = useState(false);

  // Guests get the same rail (nav items + Log in / Get started in the footer);
  // PublicLandingNav is only the narrow-screen fallback.
  if (!isDesktop) return null;

  return (
    <View
      style={[
        styles.sidebar,
        { width: collapsed ? 72 : 260 },
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRightWidth: isRTL ? 0 : StyleSheet.hairlineWidth,
          borderLeftWidth: isRTL ? StyleSheet.hairlineWidth : 0,
        },
      ]}
    >
      <AppSidebarNav
        footerExtra={<MobileAppLink variant="nav" />}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
    flexShrink: 0,
  },
});
