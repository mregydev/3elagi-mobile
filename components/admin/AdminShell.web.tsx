import { Redirect, usePathname, useRouter } from "expo-router";
import {
  BookOpen,
  Coins,
  FileWarning,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Stethoscope,
} from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Logo3elagi } from "@/components/Logo3elagi";
import { LOGO_HEIGHT } from "@/constants/brand";
import { getPostLogoutRoute } from "@/domains/auth/navigation";
import { isSignedIn } from "@/domains/auth/session";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";

type AdminNavKey =
  | "doctors"
  | "chats"
  | "specialities"
  | "pricing"
  | "rag"
  | "complaints";

const NAV: {
  key: AdminNavKey;
  label: string;
  href: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { key: "doctors", label: "Doctors", href: "/admin", Icon: Stethoscope },
  { key: "chats", label: "Chats", href: "/admin/chats", Icon: MessageSquare },
  {
    key: "specialities",
    label: "Specialities",
    href: "/admin/specialities",
    Icon: LayoutDashboard,
  },
  {
    key: "pricing",
    label: "Credit pricing",
    href: "/admin/pricing",
    Icon: Coins,
  },
  { key: "rag", label: "RAG Sources", href: "/admin/rag", Icon: BookOpen },
  {
    key: "complaints",
    label: "Complaints",
    href: "/admin/complaints",
    Icon: FileWarning,
  },
];

function activeKey(pathname: string): AdminNavKey {
  if (pathname.includes("/admin/chats")) return "chats";
  if (pathname.includes("/admin/specialities")) return "specialities";
  if (pathname.includes("/admin/pricing")) return "pricing";
  if (pathname.includes("/admin/rag")) return "rag";
  if (pathname.includes("/admin/complaints")) return "complaints";
  return "doctors";
}

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Admin web shell: left sidenav + content pane. */
export function AdminShell({ title, subtitle, children }: Props) {
  const colors = useColors();
  const router = useRouter();
  const pathname = usePathname();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const current = activeKey(pathname ?? "");

  if (!isSignedIn(profile, accessToken)) {
    return <Redirect href="/auth/login" />;
  }
  if (role?.toLowerCase() !== "admin") {
    return <Redirect href="/welcome" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.sidebar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.brand}>
          <Logo3elagi height={LOGO_HEIGHT.sidebar} />
          <Text style={[styles.brandLabel, { color: colors.mutedForeground }]}>
            Admin
          </Text>
        </View>

        <ScrollView
          style={styles.navScroll}
          contentContainerStyle={styles.navContent}
          showsVerticalScrollIndicator={false}
        >
          {NAV.map(({ key, label, href, Icon }) => {
            const active = current === key;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  if (!active) router.push(href as "/admin");
                }}
                style={({ pressed }) => [
                  styles.navItem,
                  {
                    backgroundColor: active
                      ? `${colors.primary}14`
                      : pressed
                        ? colors.muted
                        : "transparent",
                    borderColor: active ? `${colors.primary}44` : "transparent",
                  },
                ]}
              >
                <Icon
                  size={18}
                  color={active ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: active ? colors.primary : colors.foreground,
                      fontWeight: active ? "800" : "600",
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={() => {
            logout();
            router.replace(getPostLogoutRoute());
          }}
          style={({ pressed }) => [
            styles.logoutBtn,
            {
              borderColor: colors.border,
              backgroundColor: pressed ? colors.muted : "transparent",
            },
          ]}
        >
          <LogOut size={16} color={colors.foreground} />
          <Text style={[styles.logoutText, { color: colors.foreground }]}>
            Logout
          </Text>
        </Pressable>
      </View>

      <View style={styles.main}>
        <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
          <View style={styles.topBarText}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    minHeight: "100%" as unknown as number,
    width: "100%",
  },
  sidebar: {
    width: 248,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 14,
    gap: 16,
    flexShrink: 0,
  },
  brand: {
    paddingHorizontal: 8,
    gap: 6,
    marginBottom: 4,
  },
  brandLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginLeft: 4,
  },
  navScroll: { flex: 1, minHeight: 0 },
  navContent: { gap: 4, paddingBottom: 12 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    cursor: "pointer" as "auto",
  },
  navLabel: { fontSize: 14 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    cursor: "pointer" as "auto",
  },
  logoutText: { fontSize: 14, fontWeight: "700" },
  main: { flex: 1, minWidth: 0, minHeight: 0 },
  topBar: {
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarText: { gap: 4 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  content: { flex: 1, minHeight: 0 },
});
