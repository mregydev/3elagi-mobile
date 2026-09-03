import { Href, usePathname, useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import React from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Logo3elagi } from "@/components/Logo3elagi";
import { LanguageDropdown } from "@/components/language/LanguageDropdown";
import { filterAppNavItems } from "@/constants/appNav";
import { LOGO_HEIGHT } from "@/constants/brand";
import { useAuthStore } from "@/domains/auth/store";
import { navigateToWelcome } from "@/domains/auth/navigation";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { alignText, flexRow } from "@/utils/rtl";
import { webConfirm } from "@/utils/webConfirm";

type Props = {
  onNavigate?: () => void;
  showBrand?: boolean;
  /** Extra footer content (e.g. mobile app link on web). */
  footerExtra?: React.ReactNode;
};

export function AppSidebarNav({ onNavigate, showBrand = true, footerExtra }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);

  const items = filterAppNavItems(role).map((item) => ({
    ...item,
    active: item.match(pathname),
  }));

  const handleLogout = () => {
    const confirmed =
      Platform.OS === "web"
        ? webConfirm(t.tabs.logout, t.tabs.logoutConfirm)
        : true;

    if (Platform.OS !== "web") {
      Alert.alert(t.tabs.logout, t.tabs.logoutConfirm, [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.tabs.logout,
          style: "destructive",
          onPress: () => {
            logout();
            onNavigate?.();
            navigateToWelcome(router);
          },
        },
      ]);
      return;
    }

    if (!confirmed) return;
    logout();
    onNavigate?.();
    navigateToWelcome(router);
  };

  const go = (href: Href) => {
    onNavigate?.();
    router.push(href);
  };

  return (
    <View style={styles.root}>
      {showBrand ? (
        <View style={styles.brandRow}>
          <Logo3elagi height={LOGO_HEIGHT.sidebar} />
        </View>
      ) : null}

      <View style={styles.nav}>
        {items.map(({ href, labelKey, active, Icon }) => (
          <Pressable
            key={String(href)}
            onPress={() => go(href)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.navItem,
              {
                flexDirection: dir,
                backgroundColor: active
                  ? `${colors.primary}18`
                  : pressed || hovered
                    ? colors.muted
                    : "transparent",
                borderColor: active ? `${colors.primary}55` : "transparent",
              },
            ]}
          >
            <Icon size={18} color={active ? colors.primary : colors.mutedForeground} />
            <Text
              style={[
                styles.navLabel,
                { color: active ? colors.primary : colors.foreground },
              ]}
            >
              {t.tabs[labelKey]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        {footerExtra}
        <LanguageDropdown compact showLabel fullWidth placement="top" />

        {role ? (
          <Text style={[styles.roleHint, { color: colors.mutedForeground, textAlign }]}>
            {role.toLowerCase() === "doctor"
              ? t.tabs.doctorAccount
              : t.tabs.patientAccount}
          </Text>
        ) : null}

        <Pressable
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel={t.tabs.logout}
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
            styles.logoutBtn,
            {
              flexDirection: dir,
              borderColor: colors.border,
              backgroundColor: pressed || hovered ? "#fef2f2" : "transparent",
            },
          ]}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutText}>{t.tabs.logout}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 20,
  },
  brandRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  nav: { gap: 6, flex: 1 },
  navItem: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  navLabel: { fontSize: 14, fontWeight: "700", flex: 1 },
  footer: {
    gap: 10,
    marginTop: "auto",
    paddingTop: 8,
  },
  roleHint: { fontSize: 12, fontWeight: "600", paddingHorizontal: 4 },
  logoutBtn: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 14, flex: 1 },
});
