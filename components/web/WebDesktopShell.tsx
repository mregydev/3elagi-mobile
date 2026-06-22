import React from "react";
import { StyleSheet, View } from "react-native";
import { WebContentColumn } from "@/components/web/WebContentColumn";
import { WebSidebar } from "@/components/web/WebSidebar";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  children: React.ReactNode;
}

/** Web shell with sidebar — always shown on web, including medical record routes. */
export function WebDesktopShell({ children }: Props) {
  const colors = useColors();
  const { isRTL } = useI18n();

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
  shell: { flex: 1, minHeight: 0 },
  main: { minWidth: 0 },
});
