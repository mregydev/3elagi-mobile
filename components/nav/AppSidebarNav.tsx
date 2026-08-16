import { LinearGradient } from "expo-linear-gradient";
import { Href, usePathname, useRouter } from "expo-router";
import {
  LogIn,
  LogOut,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Logo3elagi } from "@/components/Logo3elagi";
import { LanguageDropdown } from "@/components/language/LanguageDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { filterAppNavItems, HOME_NAV_RESET_EVENT } from "@/constants/appNav";
import { LOGO_HEIGHT } from "@/constants/brand";
import { useAiEnabled } from "@/domains/ai/aiPreference";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { navigateToWelcome } from "@/domains/auth/navigation";
import { useNotificationsStore } from "@/domains/notifications/store";
import { useChatStore } from "@/domains/chat/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { emit } from "@/utils/eventBus";
import { alignText, flexRow } from "@/utils/rtl";
import { webConfirm } from "@/utils/webConfirm";

type Props = {
  onNavigate?: () => void;
  showBrand?: boolean;
  /** Extra footer content (e.g. mobile app link on web). */
  footerExtra?: React.ReactNode;
  /** Icon-only rail (desktop web). */
  collapsed?: boolean;
  /** Shows the rail toggle when provided; also used to expand on menu taps while collapsed. */
  onToggleCollapse?: () => void;
};

export function AppSidebarNav({
  onNavigate,
  showBrand = true,
  footerExtra,
  collapsed = false,
  onToggleCollapse,
}: Props) {
  const colors = useColors();
  const { t, isRTL, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const signedIn = isSignedIn(profile, accessToken);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const chatUnreadCount = useChatStore((s) =>
    s.conversations.reduce((total, c) => total + (c.unreadCount ?? 0), 0),
  );
  const aiEnabled = useAiEnabled();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const isArabic = locale === "ar";
  const navFontSize = isArabic ? 17 : 14;

  const items = filterAppNavItems(role, { signedIn, aiEnabled }).map((item) => ({
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
    // Home lands on the specialities grid even when the tab is already open
    // (router.navigate is a no-op there, so the drilled-in roster would stay).
    if (String(href) === "/(tabs)") emit(HOME_NAV_RESET_EVENT);
    // Tabs: navigate without stacking so Back leaves detail screens, not tabs.
    router.navigate(href);
  };

  const renderNavItem = ({ href, labelKey, active, Icon }: (typeof items)[number]) => {
    const badgeCount =
      labelKey === "notifications" ? unreadCount : labelKey === "history" ? chatUnreadCount : 0;
    return (
      <Pressable
        key={String(href)}
        onPress={() => go(href)}
        accessibilityRole="button"
        accessibilityLabel={t.tabs[labelKey]}
        accessibilityState={{ selected: active }}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          styles.navItem,
          collapsed && styles.navItemRail,
          {
            flexDirection: dir,
            backgroundColor: active
              ? colors.accent
              : pressed || hovered
                ? colors.muted
                : "transparent",
            borderLeftWidth: active && !isRTL && !collapsed ? 3 : 0,
            borderRightWidth: active && isRTL && !collapsed ? 3 : 0,
            borderLeftColor: active && !isRTL ? colors.primary : "transparent",
            borderRightColor: active && isRTL ? colors.primary : "transparent",
          },
        ]}
      >
        <Icon
          size={18}
          color={active ? colors.primary : colors.mutedForeground}
          strokeWidth={active ? 2.25 : 2}
        />
        {collapsed ? (
          // Rail has no room for the count — a dot still flags unread.
          badgeCount > 0 ? <View style={styles.railDot} /> : null
        ) : (
          <>
            <Text
              style={[
                styles.navLabel,
                {
                  color: active ? colors.primary : colors.foreground,
                  textAlign,
                  writingDirection: isRTL ? "rtl" : "ltr",
                  fontSize: navFontSize,
                  fontWeight: active ? "600" : "500",
                },
              ]}
            >
              {t.tabs[labelKey]}
            </Text>
            {badgeCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {badgeCount > 99 ? "99+" : String(badgeCount)}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </Pressable>
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      {showBrand || onToggleCollapse ? (
        <View
          style={[
            styles.brandRow,
            { flexDirection: dir, alignItems: "center" },
            collapsed && { justifyContent: "center" },
          ]}
        >
          {showBrand && !collapsed ? (
            <View style={styles.brandLogo}>
              <Logo3elagi height={LOGO_HEIGHT.sidebar} />
            </View>
          ) : null}
          {onToggleCollapse ? (
            <Pressable
              onPress={onToggleCollapse}
              accessibilityRole="button"
              accessibilityLabel={t.tabs.menu}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.iconBtn,
                { backgroundColor: pressed || hovered ? colors.muted : "transparent" },
              ]}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} color={colors.mutedForeground} />
              ) : (
                <PanelLeftClose size={18} color={colors.mutedForeground} />
              )}
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.nav}>{items.map(renderNavItem)}</View>

      <View style={styles.footer}>
        {!collapsed ? (
          <View
            style={[
              styles.prefPanel,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <View style={styles.prefBlock}>
              <Text style={[styles.prefLabel, { color: colors.mutedForeground, textAlign }]}>
                {t.settings.language}
              </Text>
              <LanguageDropdown compact showLabel fullWidth placement="top" />
            </View>

            <View style={[styles.prefRow, { flexDirection: dir }]}>
              <Text style={[styles.prefLabel, { color: colors.mutedForeground, textAlign, flex: 1 }]}>
                {t.settings.theme}
              </Text>
              <ThemeToggle />
            </View>

            <Pressable
              onPress={() => go("/contact")}
              accessibilityRole="button"
              accessibilityLabel={t.tabs.contactUs}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.contactCta,
                { opacity: pressed || hovered ? 0.92 : 1 },
              ]}
            >
              <LinearGradient
                colors={["#0F766E", "#34D399"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.contactCtaGradient, { flexDirection: dir }]}
              >
                <Mail size={18} color="#FFFFFF" />
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: "#FFFFFF",
                      textAlign,
                      writingDirection: isRTL ? "rtl" : "ltr",
                      fontWeight: "800",
                      fontSize: navFontSize,
                    },
                  ]}
                >
                  {t.tabs.contactUs}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : null}

        {signedIn ? (
          <Pressable
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel={t.tabs.logout}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.logoutBtn,
              collapsed && styles.navItemRail,
              {
                flexDirection: dir,
                borderColor: pressed || hovered ? "#ef4444" : "#fecaca",
                backgroundColor: pressed || hovered ? "#fef2f2" : "transparent",
              },
            ]}
          >
            <LogOut size={18} color="#ef4444" />
            {collapsed ? null : (
              <Text
                style={[
                  styles.logoutText,
                  {
                    textAlign,
                    writingDirection: isRTL ? "rtl" : "ltr",
                    fontSize: navFontSize,
                  },
                ]}
              >
                {t.tabs.logout}
              </Text>
            )}
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={() => go("/auth/login")}
              accessibilityRole="button"
              accessibilityLabel={t.auth.logIn}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.authCta,
                styles.authCtaLogin,
                { opacity: pressed || hovered ? 0.92 : 1 },
              ]}
            >
              <LinearGradient
                colors={["#0F766E", "#34D399"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.authCtaGradient, { flexDirection: dir }]}
              >
                <LogIn size={18} color="#FFFFFF" />
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: "#FFFFFF",
                      textAlign,
                      writingDirection: isRTL ? "rtl" : "ltr",
                      fontWeight: "800",
                      fontSize: navFontSize,
                    },
                  ]}
                >
                  {t.auth.logIn}
                </Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => go("/auth/signup")}
              accessibilityRole="button"
              accessibilityLabel={t.auth.register}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.logoutBtn,
                styles.authCtaSignup,
                {
                  flexDirection: dir,
                  borderColor: "#0F766E",
                  backgroundColor:
                    pressed || hovered
                      ? "rgba(15, 118, 110,0.16)"
                      : "rgba(15, 118, 110,0.08)",
                },
              ]}
            >
              <UserPlus size={18} color="#0F766E" />
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: "#0F766E",
                    textAlign,
                    writingDirection: isRTL ? "rtl" : "ltr",
                    fontWeight: "800",
                    fontSize: navFontSize,
                  },
                ]}
              >
                {t.auth.register}
              </Text>
            </Pressable>
          </>
        )}

        {collapsed ? null : footerExtra}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 10,
  },
  brandRow: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  brandLogo: { flex: 1, alignItems: "center" },
  iconBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  nav: { gap: 2 },
  navItem: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },
  navItemRail: {
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  railDot: {
    position: "absolute",
    top: 8,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  navLabel: { fontSize: 14, flex: 1 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  footer: {
    gap: 8,
    // Preferences / logout stay anchored at the sidebar bottom.
    marginTop: "auto",
    paddingTop: 16,
  },
  prefPanel: {
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  prefBlock: {
    gap: 6,
  },
  prefRow: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 2,
  },
  prefLabel: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 2,
  },
  contactCta: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 2,
    shadowColor: "#0F766E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  contactCtaGradient: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  logoutBtn: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  authCta: {
    borderRadius: 12,
    overflow: "hidden",
  },
  authCtaLogin: {
    shadowColor: "#0F766E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  authCtaGradient: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  authCtaSignup: {
    borderWidth: 2,
  },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 14, flex: 1 },
});
