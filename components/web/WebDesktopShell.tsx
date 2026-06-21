import React from "react";
import { StyleSheet, View } from "react-native";
import { WebContentColumn } from "@/components/web/WebContentColumn";
import { WebSidebar } from "@/components/web/WebSidebar";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";

interface Props {
  children: React.ReactNode;
}

/** Desktop shell with sidebar — matches the Records tab layout on web. */
export function WebDesktopShell({ children }: Props) {
  const colors = useColors();
  const { isRTL } = useI18n();
  const { isDesktop } = useWebLayout();

  if (!isDesktop) {
    return <View style={styles.fill}>{children}</View>;
  }

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: colors.background,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
    >
      <WebSidebar />
      <WebContentColumn wide style={styles.main}>
        {children}
      </WebContentColumn>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0 },
  shell: { flex: 1, minHeight: 0 },
  main: { minWidth: 0 },
});
