import { Redirect, Tabs } from "expo-router";
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
  Stethoscope,
  User,
  Users,
} from "lucide-react-native";
import React from "react";
import { AppSidebarDrawer } from "@/components/nav/AppSidebarDrawer";
import { AppSidebarProvider } from "@/contexts/AppSidebarContext";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

export default function TabsLayout() {
  const colors = useColors();
  const { t } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const hydrated = useAuthStore((s) => s.hydrated);
  const signedIn = isSignedIn(profile, accessToken);
  const isDoctor = role?.toLowerCase() === "doctor";

  if (!hydrated) return null;
  if (!signedIn) return <Redirect href="/welcome" />;

  return (
    <AppSidebarProvider>
      <Tabs
        tabBar={() => null}
        screenOptions={{
          headerShown: false,
          freezeOnBlur: true,
          lazy: true,
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
          name="our-doctors"
          options={{
            title: t.tabs.ourDoctors,
            tabBarIcon: ({ color, size }) => (
              <Stethoscope color={color} size={size} />
            ),
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
            tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
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
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="reviews"
          options={{
            title: t.tabs.reviews,
            href: isDoctor ? undefined : null,
            tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="intake"
          options={{
            title: t.tabs.intake,
            href: null,
            tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} />,
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
      <AppSidebarDrawer />
    </AppSidebarProvider>
  );
}
