import { LinearGradient } from "expo-linear-gradient";
import { Href, usePathname, useRouter } from "expo-router";
import { LogIn, LogOut, Mail, UserPlus } from "lucide-react-native";
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
import { filterAppNavItems } from "@/constants/appNav";
import { LOGO_HEIGHT } from "@/constants/brand";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { navigateToWelcome } from "@/domains/auth/navigation";
import { useNotificationsStore } from "@/domains/notifications/store";
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
  const { t, isRTL, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const signedIn = isSignedIn(profile, accessToken);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const isArabic = locale === "ar";
  const navFontSize = isArabic ? 17 : 14;
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  const items = filterAppNavItems(role, { signedIn }).map((item) => ({
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
    // Tabs: navigate without stacking so Back leaves detail screens, not tabs.
    router.navigate(href);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      {showBrand ? (
        <View
          style={[
            styles.brandRow,
            { alignItems: isRTL ? "flex-end" : "center" },
          ]}
        >
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
                {
                  color: active ? colors.primary : colors.foreground,
                  textAlign,
                  writingDirection: isRTL ? "rtl" : "ltr",
                  fontSize: navFontSize,
                },
              ]}
            >
              {t.tabs[labelKey]}
            </Text>
            {labelKey === "notifications" && unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeLabel}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.prefBlock}>
          <Text style={[styles.prefLabel, { color: colors.mutedForeground, textAlign }]}>
            {t.settings.language}
          </Text>
          <LanguageDropdown compact showLabel fullWidth placement="top" />
        </View>

        {role ? (
          <Text style={[styles.roleHint, { color: colors.mutedForeground, textAlign }]}>
            {role.toLowerCase() === "doctor"
              ? t.tabs.doctorAccount
              : t.tabs.patientAccount}
          </Text>
        ) : null}

        <Pressable
          onPress={() => go("/contact")}
          accessibilityRole="button"
          accessibilityLabel={t.tabs.contactUs}
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
            styles.logoutBtn,
            {
              flexDirection: dir,
              borderColor: colors.border,
              backgroundColor:
                pressed || hovered ? colors.muted : "transparent",
            },
          ]}
        >
          <Mail size={18} color={colors.primary} />
          <Text
            style={[
              styles.navLabel,
              {
                color: colors.foreground,
                textAlign,
                writingDirection: isRTL ? "rtl" : "ltr",
                fontSize: navFontSize,
              },
            ]}
          >
            {t.tabs.contactUs}
          </Text>
        </Pressable>

        {signedIn ? (
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
                colors={["#3057F2", "#1B9AAA"]}
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
                  borderColor: "#3057F2",
                  backgroundColor:
                    pressed || hovered
                      ? "rgba(48,87,242,0.16)"
                      : "rgba(48,87,242,0.08)",
                },
              ]}
            >
              <UserPlus size={18} color="#1D4ED8" />
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: "#1D4ED8",
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

        {footerExtra}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    // Extra bottom pad so logout isn’t clipped at the viewport edge.
    paddingBottom: 28,
    gap: 8,
  },
  brandRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  nav: { gap: 4 },
  navItem: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  navLabel: { fontSize: 14, fontWeight: "700", flex: 1 },
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
    gap: 12,
    // Push Android / language / contact / logout toward the sidebar bottom.
    marginTop: "auto",
    paddingTop: 16,
  },
  prefBlock: {
    gap: 6,
  },
  prefLabel: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 2,
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
  authCta: {
    borderRadius: 12,
    overflow: "hidden",
  },
  authCtaLogin: {
    shadowColor: "#3057F2",
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
