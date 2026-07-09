import { Redirect, Tabs } from "expo-router";
import { Activity, Bot, CalendarClock, ClipboardList, Coins, History, Home, ListChecks, Star, User, Users } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

export default function TabsLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const hydrated = useAuthStore((s) => s.hydrated);
  const signedIn = isSignedIn(profile, accessToken);
  const isDoctor = role?.toLowerCase() === "doctor";

  const bottomGap = Math.max(insets.bottom, Platform.OS === "android" ? 12 : 8);

  if (!hydrated) return null;
  if (!signedIn) return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Freeze blurred tabs so off-screen screens stop re-rendering while
        // you're on another tab — keeps switching snappy.
        freezeOnBlur: true,
        lazy: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60 + bottomGap,
          paddingTop: 6,
          paddingBottom: bottomGap,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
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
          tabBarHideOnKeyboard: false,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: t.tabs.activity,
          // Patient-only hub for appointments, chats and records.
          href: isDoctor ? null : undefined,
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t.tabs.history,
          // Now lives inside the Patients (doctor) / Activity (patient) hub.
          href: null,
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
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
          // Now a section of the Patients hub.
          href: null,
          tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="intake"
        options={{
          title: t.tabs.intake,
          // Now a section of the Patients hub.
          href: null,
          tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t.tabs.appointments,
          // Now inside the Patients (doctor) / Activity (patient) hub.
          href: null,
          tabBarIcon: ({ color, size }) => (
            <CalendarClock color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: t.tabs.records,
          // Removed for doctors; inside the Activity hub for patients.
          href: null,
          tabBarIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="points"
        options={{
          title: t.tabs.points,
          // Doctors manage earnings inside Patients → Consultations.
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
  );
}
