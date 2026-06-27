import { Link, usePathname } from "expo-router";
import {
  Bot,
  ClipboardList,
  Coins,
  History,
  Home,
  Star,
  User,
  type LucideIcon,
} from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

type TabItem = {
  href: string;
  title: string;
  Icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  hidden?: boolean;
};

interface Props {
  height: number;
  bottomGap: number;
}

export function WebMobileTabBar({ height, bottomGap }: Props) {
  const colors = useColors();
  const { t } = useI18n();
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const isDoctor = role?.toLowerCase() === "doctor";

  const items: TabItem[] = [
    {
      href: "/(tabs)",
      title: t.tabs.home,
      Icon: Home,
      isActive: (path) => path === "/" || path === "/(tabs)",
    },
    {
      href: "/(tabs)/assistant",
      title: t.tabs.assistant,
      Icon: Bot,
      isActive: (path) => path.includes("/assistant") || path.includes("/ai/"),
    },
    {
      href: "/(tabs)/history",
      title: t.tabs.history,
      Icon: History,
      isActive: (path) => path.includes("/history"),
    },
    {
      href: "/(tabs)/reviews",
      title: t.tabs.reviews,
      Icon: Star,
      isActive: (path) => path.includes("/reviews"),
      hidden: !isDoctor,
    },
    {
      href: "/(tabs)/records",
      title: t.tabs.records,
      Icon: ClipboardList,
      isActive: (path) => path.includes("/records") || path.includes("/medical"),
    },
    {
      href: "/(tabs)/points",
      title: t.tabs.points,
      Icon: Coins,
      isActive: (path) => path.includes("/points"),
    },
    {
      href: "/(tabs)/profile",
      title: t.tabs.profile,
      Icon: User,
      isActive: (path) => path.includes("/profile"),
    },
  ];

  const visibleItems = items.filter((item) => !item.hidden);

  return (
    <View
      style={[
        styles.bar,
        {
          height,
          paddingBottom: bottomGap,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      ]}
    >
      {visibleItems.map(({ href, title, Icon, isActive }) => {
        const active = isActive(pathname);
        const tint = active ? colors.primary : colors.mutedForeground;

        return (
          <Link key={href} href={href} asChild>
            <Pressable style={styles.tab} accessibilityRole="button">
              <Icon color={tint} size={22} />
              <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
                {title}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
});
