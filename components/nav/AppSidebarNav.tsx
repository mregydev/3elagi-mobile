import { LinearGradient } from "expo-linear-gradient";
import { Href, usePathname, useRouter } from "expo-router";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Languages,
  LogIn,
  LogOut,
  Mail,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  SunMoon,
  UserPlus,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Logo3elagi } from "@/components/Logo3elagi";
import { AccentPicker } from "@/components/AccentPicker";
import { LanguageDropdown } from "@/components/language/LanguageDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  APP_NAV_GROUP_ICONS,
  filterAppNavItems,
  groupAppNavItems,
  HOME_NAV_RESET_EVENT,
} from "@/constants/appNav";
import { LOGO_HEIGHT } from "@/constants/brand";
import { UI } from "@/constants/uiTokens";
import { useAiEnabled } from "@/domains/ai/aiPreference";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { navigateToWelcome } from "@/domains/auth/navigation";
import { useNotificationsStore } from "@/domains/notifications/store";
import { useChatStore } from "@/domains/chat/store";
import { useAccentGradient, useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { emit } from "@/utils/eventBus";
import { alignText, flexRow } from "@/utils/rtl";
import { webConfirm } from "@/utils/webConfirm";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const accentGradient = useAccentGradient();
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
  const sections = groupAppNavItems(items);
  // Groups start closed; opening one is a per-session preference.
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});
  const [preferencesOpen, setPreferencesOpen] = React.useState(false);
  const [prefMeasuredHeight, setPrefMeasuredHeight] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);
  const prefBodyHeight = useSharedValue(0);
  const prefExpand = useSharedValue(0);

  const isGroupExpanded = (group: string, hasActive: boolean) =>
    group in openGroups ? openGroups[group] : hasActive;

  const togglePreferences = () => {
    if (Platform.OS !== "web") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setPreferencesOpen((open) => !open);
  };

  React.useEffect(() => {
    if (!preferencesOpen || Platform.OS === "web") return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [preferencesOpen]);

  const toggleGroup = (group: string, hasActive: boolean) =>
    setOpenGroups((prev) => {
      const expanded = group in prev ? prev[group] : hasActive;
      return { ...prev, [group]: !expanded };
    });

  const onPrefBodyLayout = (height: number) => {
    if (height > 0) setPrefMeasuredHeight(height);
  };

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    prefExpand.value = withTiming(preferencesOpen ? 1 : 0, {
      duration: UI.duration.normal,
      easing: Easing.out(Easing.cubic),
    });
  }, [preferencesOpen, prefExpand]);

  React.useEffect(() => {
    if (prefMeasuredHeight > 0) {
      prefBodyHeight.value = prefMeasuredHeight;
    }
  }, [prefMeasuredHeight, prefBodyHeight]);

  const prefBodyAnimatedStyle = useAnimatedStyle(() => ({
    height: prefExpand.value * prefBodyHeight.value,
  }));

  const prefInnerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(prefExpand.value, [0, 0.25, 1], [0, 1, 1]),
  }));

  const prefChevronStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(prefExpand.value, [0, 1], [isRTL ? 90 : -90, 0])}deg`,
      },
    ],
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
          collapsed && active && styles.navItemRailActive,
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
          badgeCount > 0 ? (
            <View style={[styles.railDot, active && styles.railDotActive]} />
          ) : null
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

  const renderPreferenceRows = () => (
    <>
      <View
        style={[
          styles.prefNavItem,
          { flexDirection: dir, backgroundColor: "transparent" },
        ]}
      >
        <Languages size={18} color={colors.mutedForeground} strokeWidth={2} />
        <Text
          style={[
            styles.navLabel,
            {
              color: colors.foreground,
              textAlign,
              writingDirection: isRTL ? "rtl" : "ltr",
              fontSize: navFontSize,
              fontWeight: "500",
            },
          ]}
        >
          {t.settings.language}
        </Text>
        <LanguageDropdown compact placement="bottom" />
      </View>

      <View
        style={[
          styles.prefNavItem,
          { flexDirection: dir, backgroundColor: "transparent" },
        ]}
      >
        <SunMoon size={18} color={colors.mutedForeground} strokeWidth={2} />
        <Text
          style={[
            styles.navLabel,
            {
              color: colors.foreground,
              textAlign,
              writingDirection: isRTL ? "rtl" : "ltr",
              fontSize: navFontSize,
              fontWeight: "500",
            },
          ]}
        >
          {t.settings.theme}
        </Text>
        <ThemeToggle />
      </View>

      <View
        style={[
          styles.prefNavItem,
          { flexDirection: dir, backgroundColor: "transparent" },
        ]}
      >
        <Palette size={18} color={colors.mutedForeground} strokeWidth={2} />
        <Text
          style={[
            styles.navLabel,
            {
              color: colors.foreground,
              textAlign,
              writingDirection: isRTL ? "rtl" : "ltr",
              fontSize: navFontSize,
              fontWeight: "500",
            },
          ]}
        >
          {t.settings.accentColor}
        </Text>
        <AccentPicker />
      </View>
    </>
  );

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.root}
      contentContainerStyle={[styles.content, collapsed && styles.contentRail]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      {showBrand || onToggleCollapse ? (
        <View
          style={[
            styles.brandRow,
            { flexDirection: dir, alignItems: "center" },
            // Rail: mark above the toggle, both centred in the collapsed column.
            collapsed && styles.brandRowRail,
          ]}
        >
          {showBrand ? (
            <View style={collapsed ? undefined : styles.brandLogo}>
              <Logo3elagi
                height={collapsed ? 26 : LOGO_HEIGHT.sidebar}
                markOnly={collapsed}
              />
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

      <View style={styles.nav}>
        {sections.map((section) => {
          const hasActive = section.items.some((item) => item.active);
          const expanded =
            !section.group ||
            collapsed ||
            (section.group ? isGroupExpanded(section.group, hasActive) : false);

          return (
            <View key={String(section.items[0].href)} style={styles.navSection}>
              {/* The rail has no room for headers; a divider keeps the grouping. */}
              {section.group && collapsed ? (
                <View style={[styles.railDivider, { backgroundColor: colors.border }]} />
              ) : null}
              {section.group && !collapsed ? (
                // Reads as a menu item like any other, with a chevron marking
                // that it opens rather than navigates.
                (() => {
                  const GroupIcon = APP_NAV_GROUP_ICONS[section.group];
                  return (
                    <Pressable
                      onPress={() => toggleGroup(section.group!, hasActive)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded }}
                      accessibilityLabel={t.tabs[section.group]}
                      style={({
                        pressed,
                        hovered,
                      }: {
                        pressed: boolean;
                        hovered?: boolean;
                      }) => [
                        styles.navItem,
                        {
                          flexDirection: dir,
                          backgroundColor:
                            pressed || hovered ? colors.muted : "transparent",
                        },
                      ]}
                    >
                      <GroupIcon size={18} color={colors.mutedForeground} strokeWidth={2} />
                      <Text
                        style={[
                          styles.navLabel,
                          {
                            color: colors.foreground,
                            textAlign,
                            writingDirection: isRTL ? "rtl" : "ltr",
                            fontSize: navFontSize,
                            fontWeight: "500",
                          },
                        ]}
                      >
                        {t.tabs[section.group]}
                      </Text>
                      {expanded ? (
                        <ChevronDown size={16} color={colors.mutedForeground} />
                      ) : isRTL ? (
                        <ChevronLeft size={16} color={colors.mutedForeground} />
                      ) : (
                        <ChevronRight size={16} color={colors.mutedForeground} />
                      )}
                    </Pressable>
                  );
                })()
              ) : null}
              {expanded
                ? section.items.map(renderNavItem)
                : null}
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        {!collapsed ? (
          <View style={styles.navSection}>
            <View
              style={[
                styles.prefPanel,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <Pressable
                onPress={togglePreferences}
                accessibilityRole="button"
                accessibilityState={{ expanded: preferencesOpen }}
                accessibilityLabel={t.settings.preferences}
                style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                  styles.navItem,
                  {
                    flexDirection: dir,
                    backgroundColor:
                      pressed || hovered ? colors.card : "transparent",
                  },
                ]}
              >
                <Settings size={18} color={colors.mutedForeground} strokeWidth={2} />
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: colors.foreground,
                      textAlign,
                      writingDirection: isRTL ? "rtl" : "ltr",
                      fontSize: navFontSize,
                      fontWeight: "500",
                    },
                  ]}
                >
                  {t.settings.preferences}
                </Text>
                {Platform.OS === "web" ? (
                  <Animated.View style={prefChevronStyle}>
                    <ChevronDown size={16} color={colors.mutedForeground} />
                  </Animated.View>
                ) : preferencesOpen ? (
                  <ChevronDown size={16} color={colors.mutedForeground} />
                ) : (
                  <ChevronDown
                    size={16}
                    color={colors.mutedForeground}
                    style={{
                      transform: [{ rotate: isRTL ? "90deg" : "-90deg" }],
                    }}
                  />
                )}
              </Pressable>

              {Platform.OS === "web" ? (
                <>
                  <View
                    pointerEvents="none"
                    style={styles.prefMeasure}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <View
                      onLayout={(event) => {
                        onPrefBodyLayout(event.nativeEvent.layout.height);
                      }}
                    >
                      {renderPreferenceRows()}
                    </View>
                  </View>
                  <Animated.View
                    style={[styles.prefBodyClip, prefBodyAnimatedStyle]}
                    pointerEvents={preferencesOpen ? "auto" : "none"}
                  >
                    <Animated.View style={prefInnerAnimatedStyle}>
                      {renderPreferenceRows()}
                    </Animated.View>
                  </Animated.View>
                </>
              ) : (
                <>
                  <View
                    pointerEvents="none"
                    style={styles.prefMeasure}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <View
                      onLayout={(event) => {
                        onPrefBodyLayout(event.nativeEvent.layout.height);
                      }}
                    >
                      {renderPreferenceRows()}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.prefBodyClip,
                      { height: preferencesOpen ? prefMeasuredHeight : 0 },
                    ]}
                    pointerEvents={preferencesOpen ? "auto" : "none"}
                  >
                    {renderPreferenceRows()}
                  </View>
                </>
              )}
            </View>

            <Pressable
              onPress={() => go("/contact")}
              accessibilityRole="button"
              accessibilityLabel={t.tabs.contactUs}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.navItem,
                {
                  flexDirection: dir,
                  backgroundColor: pressed || hovered ? colors.muted : "transparent",
                },
              ]}
            >
              <Mail size={18} color={colors.mutedForeground} strokeWidth={2} />
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: colors.foreground,
                    textAlign,
                    writingDirection: isRTL ? "rtl" : "ltr",
                    fontWeight: "500",
                    fontSize: navFontSize,
                  },
                ]}
              >
                {t.tabs.contactUs}
              </Text>
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
                collapsed && styles.authCtaRail,
                { shadowColor: colors.primary, opacity: pressed || hovered ? 0.92 : 1 },
              ]}
            >
              <LinearGradient
                colors={accentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.authCtaGradient,
                  { flexDirection: dir },
                  collapsed && styles.authCtaGradientRail,
                ]}
              >
                <LogIn size={18} color="#FFFFFF" />
                {collapsed ? null : (
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
                )}
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => go("/auth/signup")}
              accessibilityRole="button"
              accessibilityLabel={t.auth.register}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.logoutBtn,
                styles.authCtaSignup,
                collapsed && styles.authCtaRail,
                {
                  flexDirection: dir,
                  borderColor: colors.primary,
                  backgroundColor: `${colors.primary}${pressed || hovered ? "29" : "14"}`,
                },
              ]}
            >
              <UserPlus size={18} color={colors.primary} />
              {collapsed ? null : (
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: colors.primary,
                      textAlign,
                      writingDirection: isRTL ? "rtl" : "ltr",
                      fontWeight: "800",
                      fontSize: navFontSize,
                    },
                  ]}
                >
                  {t.auth.register}
                </Text>
              )}
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
  contentRail: {
    paddingHorizontal: 6,
    alignItems: "center",
  },
  brandRow: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  brandLogo: { flex: 1, alignItems: "center" },
  brandRowRail: {
    flexDirection: "column",
    justifyContent: "center",
    gap: 4,
    marginBottom: 0,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  navSection: {
    gap: 2,
  },
  railDivider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: 8,
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
    alignSelf: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 10,
  },
  navItemRailActive: {
    width: 38,
    height: 38,
    borderRadius: 11,
  },
  railDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#ef4444",
  },
  railDotActive: {
    top: 5,
    right: 5,
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
    marginTop: "auto",
    paddingTop: 16,
  },
  prefPanel: {
    gap: 2,
    padding: 6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  prefMeasure: {
    position: "absolute",
    opacity: 0,
    width: "100%",
    left: 0,
    top: 0,
    zIndex: -1,
  },
  prefBodyClip: {
    overflow: "hidden",
  },
  prefNavItem: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    minWidth: 0,
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
    // Breathing room between the preferences block (Contact us) and the CTAs.
    marginTop: 22,
    // shadowColor is set inline from the active accent.
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
  // Rail: same compact square as every other icon item.
  authCtaRail: {
    alignSelf: "center",
    width: 36,
    height: 36,
    minHeight: 36,
    marginTop: 8,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  authCtaGradientRail: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 0,
  },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 14, flex: 1 },
});
