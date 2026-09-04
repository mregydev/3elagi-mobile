import { Tabs } from "expo-router";
import {
  Bell,
  Bot,
  CalendarClock,
  ClipboardList,
  Coins,
  History,
  Home,
  Info,
  ListChecks,
  MessageSquare,
  Star,
  User,
  Users,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { AppSidebarDrawer } from "@/components/nav/AppSidebarDrawer";
import { PublicLandingNav } from "@/components/marketing/PublicLandingNav";
import { WebContentColumn } from "@/components/web/WebContentColumn";
import { WebSidebar } from "@/components/web/WebSidebar";
import { AppSidebarProvider } from "@/contexts/AppSidebarContext";
import { useAiEnabled } from "@/domains/ai/aiPreference";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";

export default function TabsLayoutWeb() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isMobile } = useWebLayout();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const role = useAuthStore((s) => s.role);
  const signedIn = isSignedIn(profile, accessToken);
  const isDoctor = role?.toLowerCase() === "doctor";
  const aiEnabled = useAiEnabled();
  const authOnlyHref = signedIn ? undefined : null;
  // About us is a marketing page — drop it from the tabs once signed in.
  const guestOnlyHref = signedIn ? null : undefined;

  if (!hydrated) return null;

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
        {/* Guests: full-bleed column so the landing scrollbar sits on the page
            edge (right in English, left in Arabic via #brand-scroll CSS). */}
        <WebContentColumn wide fluid={!signedIn} style={styles.main}>
          {/* Mobile guests use PublicLandingNav; tablet+ guests use the sidebar. */}
          {!signedIn && isMobile ? (
            <View style={styles.guestNav}>
              <PublicLandingNav />
            </View>
          ) : null}
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
              name="about-us"
              options={{
                title: t.tabs.aboutUs,
                href: guestOnlyHref,
                tabBarIcon: ({ color, size }) => (
                  <Info color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="for-doctors"
              options={{
                title: t.tabs.forDoctors,
                href: guestOnlyHref,
              }}
            />
            <Tabs.Screen
              name="faq"
              options={{
                title: t.tabs.faq,
                href: guestOnlyHref,
              }}
            />
            <Tabs.Screen
              name="pricing"
              options={{
                title: t.tabs.pricing,
                href: null,
                tabBarIcon: ({ color, size }) => <Coins color={color} size={size} />,
              }}
            />
            <Tabs.Screen
              name="notifications"
              options={{
                title: t.tabs.notifications,
                href: authOnlyHref,
                tabBarIcon: ({ color, size }) => (
                  <Bell color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="assistant"
              options={{
                title: t.tabs.assistant,
                tabBarIcon: ({ color, size }) => <Bot color={color} size={size} />,
                href: aiEnabled ? undefined : null,
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
                href: authOnlyHref,
                tabBarIcon: ({ color, size }) => (
                  <CalendarClock color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="consultations"
              options={{
                title: t.tabs.consultations,
                href: authOnlyHref,
                tabBarIcon: ({ color, size }) => (
                  <MessageSquare color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="history"
              options={{
                title: t.tabs.history,
                href: authOnlyHref,
                tabBarIcon: ({ color, size }) => (
                  <History color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="records"
              options={{
                title: t.tabs.records,
                href: !signedIn || isDoctor ? null : undefined,
                tabBarIcon: ({ color, size }) => (
                  <ClipboardList color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="patients"
              options={{
                title: t.tabs.patients,
                href: signedIn && isDoctor ? undefined : null,
                tabBarIcon: ({ color, size }) => (
                  <Users color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="reviews"
              options={{
                title: t.tabs.reviews,
                href: signedIn && isDoctor ? undefined : null,
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
                // Credits are gone from navigation — consultations are paid in
                // cash through the doctor's own payment link.
                href: null,
                tabBarIcon: ({ color, size }) => <Coins color={color} size={size} />,
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: t.tabs.profile,
                href: authOnlyHref,
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
  // Matches the 95% guest content width in the home scroll below it.
  guestNav: { width: "95%", alignSelf: "center" },
});
