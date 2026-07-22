import { Tabs, useRouter } from "expo-router";
import {
  Bot,
  CalendarClock,
  ClipboardList,
  Coins,
  History,
  Home,
  ListChecks,
  MessageSquare,
  Star,
  User,
  Users,
} from "lucide-react-native";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { AppSidebarDrawer } from "@/components/nav/AppSidebarDrawer";
import { WebContentColumn } from "@/components/web/WebContentColumn";
import { WebSidebar } from "@/components/web/WebSidebar";
import { AppSidebarProvider } from "@/contexts/AppSidebarContext";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { navigateToWelcome } from "@/domains/auth/navigation";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

export default function TabsLayoutWeb() {
  const colors = useColors();
  const router = useRouter();
  const { t, isRTL } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const role = useAuthStore((s) => s.role);
  const signedIn = isSignedIn(profile, accessToken);
  const isDoctor = role?.toLowerCase() === "doctor";

  useEffect(() => {
    if (!hydrated) return;
    if (!signedIn) {
      navigateToWelcome(router);
    }
  }, [hydrated, signedIn, router]);

  if (!hydrated) return null;
  if (!signedIn) return null;

  return (
    <AppSidebarProvider>
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
          <Tabs
            tabBar={() => null}
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.mutedForeground,
              tabBarStyle: { display: "none" },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: t.tabs.home,
                tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
              }}
            />
            <Tabs.Screen
              name="assistant"
              options={{
                title: t.tabs.assistant,
                tabBarIcon: ({ color, size }) => <Bot color={color} size={size} />,
              }}
            />
            <Tabs.Screen
              name="activity"
              options={{
                title: t.tabs.activity,
                href: null,
              }}
            />
            <Tabs.Screen
              name="appointments"
              options={{
                title: t.tabs.appointments,
                tabBarIcon: ({ color, size }) => (
                  <CalendarClock color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="consultations"
              options={{
                title: t.tabs.consultations,
                tabBarIcon: ({ color, size }) => (
                  <MessageSquare color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="history"
              options={{
                title: t.tabs.history,
                tabBarIcon: ({ color, size }) => (
                  <History color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="records"
              options={{
                title: t.tabs.records,
                href: isDoctor ? null : undefined,
                tabBarIcon: ({ color, size }) => (
                  <ClipboardList color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="patients"
              options={{
                title: t.tabs.patients,
                href: isDoctor ? undefined : null,
                tabBarIcon: ({ color, size }) => (
                  <Users color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="reviews"
              options={{
                title: t.tabs.reviews,
                href: null,
                tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
              }}
            />
            <Tabs.Screen
              name="intake"
              options={{
                title: t.tabs.intake,
                href: null,
                tabBarIcon: ({ color, size }) => (
                  <ListChecks color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="points"
              options={{
                title: t.tabs.points,
                href: isDoctor ? null : undefined,
                tabBarIcon: ({ color, size }) => <Coins color={color} size={size} />,
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: t.tabs.profile,
                tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
              }}
            />
          </Tabs>
        </WebContentColumn>
      </View>
      <AppSidebarDrawer />
    </AppSidebarProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, minHeight: 0, overflow: "hidden" },
  main: { minWidth: 0 },
});
