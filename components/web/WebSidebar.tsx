import { Href, usePathname, useRouter } from "expo-router";
import {
  Bot,
  ClipboardList,
  Coins,
  History,
  Home,
  LogOut,
  Star,
  User,
} from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Logo3elagi } from "@/components/Logo3elagi";
import { MobileAppLink } from "@/components/web/MobileAppLink.web";
import { LOGO_HEIGHT } from "@/constants/brand";
import type { Translations } from "@/constants/translations";
import { useAuthStore } from "@/domains/auth/store";
import { navigateToWelcome } from "@/domains/auth/navigation";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { alignText, flexRow } from "@/utils/rtl";
import { webConfirm } from "@/utils/webConfirm";

type NavItem = {
  href: Href;
  labelKey: keyof Translations["tabs"];
  match: (path: string) => boolean;
  Icon: typeof Home;
  doctorOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/(tabs)",
    labelKey: "home",
    match: (path) => path === "/" || path.startsWith("/(tabs)") && !path.includes("history") && !path.includes("records") && !path.includes("points") && !path.includes("profile") && !path.includes("assistant"),
    Icon: Home,
  },
  {
    href: "/(tabs)/assistant",
    labelKey: "aiAssistant",
    match: (path) => path.includes("assistant"),
    Icon: Bot,
  },
  {
    href: "/(tabs)/history",
    labelKey: "history",
    match: (path) => path.includes("history"),
    Icon: History,
  },
  {
    href: "/(tabs)/reviews",
    labelKey: "reviews",
    match: (path) => path.includes("reviews"),
    Icon: Star,
    doctorOnly: true,
  },
  {
    href: "/(tabs)/records",
    labelKey: "records",
    match: (path) =>
      path.includes("records") || path.includes("/medical") || path.includes("/patients"),
    Icon: ClipboardList,
  },
  {
    href: "/(tabs)/points",
    labelKey: "points",
    match: (path) => path.includes("points"),
    Icon: Coins,
  },
  {
    href: "/(tabs)/profile",
    labelKey: "profile",
    match: (path) => path.includes("profile"),
    Icon: User,
  },
];

function isHomePath(path: string) {
  return (
    path === "/" ||
    path === "/(tabs)" ||
    path.endsWith("/index") ||
    (path.includes("(tabs)") &&
      !path.includes("history") &&
      !path.includes("records") &&
      !path.includes("points") &&
      !path.includes("profile") &&
      !path.includes("assistant") &&
      !path.includes("patients"))
  );
}

export function WebSidebar() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isDesktop } = useWebLayout();
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);

  const handleLogout = () => {
    const confirmed = webConfirm(t.tabs.logout, t.tabs.logoutConfirm);

    if (!confirmed) return;

    logout();
    navigateToWelcome(router);
  };

  const isDoctor = role?.toLowerCase() === "doctor";

  const items = NAV_ITEMS.filter((item) => !item.doctorOnly || isDoctor).map(
    (item) => ({
      ...item,
      active: item.Icon === Home ? isHomePath(pathname) : item.match(pathname),
    }),
  );

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
      <View style={styles.brandRow}>
        <Logo3elagi height={LOGO_HEIGHT.sidebar} />
      </View>

      <View style={styles.nav}>
        {items.map(({ href, labelKey, active, Icon }) => (
          <Pressable
            key={String(href)}
            onPress={() => router.push(href)}
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
        <MobileAppLink variant="nav" />

        {role ? (
          <Text
            style={[
              styles.roleHint,
              { color: colors.mutedForeground, textAlign },
            ]}
          >
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
  sidebar: {
    width: 248,
    height: "100%",
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
