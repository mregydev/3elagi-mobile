import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { FirebaseBootstrap } from "@/components/FirebaseBootstrap";
import { AppSplash } from "@/components/SplashScreen";
import { AuthRedirect } from "@/components/AuthRedirect";
import { ChatMessageSync } from "@/components/ChatMessageSync";
import { PresenceChatSync } from "@/components/PresenceChatSync";
import { PresenceSocket } from "@/components/PresenceSocket";
import colors from "@/constants/colors";
import { useAuthStore } from "@/domains/auth/store";
import { fetchAllMedicalHistory } from "@/domains/medical/api";
import { useMedicalStore } from "@/domains/medical/store";
import { usePointsStore } from "@/domains/points/store";
import { useRemindersStore } from "@/domains/reminders/store";

function MedicalDataLoader() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const setRecordsFromApi = useMedicalStore((s) => s.setRecordsFromApi);
  const clear = useMedicalStore((s) => s.clear);

  const isPatient = role?.toLowerCase() === "patient";
  const isDoctor = role?.toLowerCase() === "doctor";
  const loadOwnRecords = isPatient || isDoctor;

  useEffect(() => {
    if (!hydrated) return;

    if (!profile || !accessToken || !loadOwnRecords) {
      clear();
      return;
    }

    let cancelled = false;

    fetchAllMedicalHistory(profile.id, accessToken, role ?? undefined)
      .then((apiRecords) => {
        if (!cancelled) setRecordsFromApi(apiRecords, profile.id);
      })
      .catch(() => {
        if (!cancelled) setRecordsFromApi([], profile.id);
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, profile?.id, accessToken, loadOwnRecords, role, setRecordsFromApi, clear]);

  return null;
}

function RemindersBootstrap() {
  const init = useRemindersStore((s) => s.init);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    void init();
  }, [hydrated, init]);

  return null;
}

function PointsDataLoader() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const loadPoints = usePointsStore((s) => s.loadPoints);
  const clear = usePointsStore((s) => s.clear);

  const canUsePoints =
    role?.toLowerCase() === "patient" || role?.toLowerCase() === "doctor";

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken || !canUsePoints) {
      clear();
      return;
    }
    void loadPoints(accessToken);
  }, [hydrated, accessToken, canUsePoints, loadPoints, clear]);

  return null;
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashDone = useCallback(() => setShowSplash(false), []);

  if (showSplash) {
    return <AppSplash onDone={handleSplashDone} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.light.background }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <StatusBar style="dark" />
          <MedicalDataLoader />
          <PointsDataLoader />
          <RemindersBootstrap />
          <FirebaseBootstrap />
          <PresenceSocket />
          <PresenceChatSync />
          <ChatMessageSync />
          <AuthRedirect />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth/login" options={{ presentation: "modal" }} />
            <Stack.Screen name="auth/signup" options={{ presentation: "modal" }} />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="doctor/[doctorId]" />
            <Stack.Screen name="patients/[userId]" />
            <Stack.Screen name="medical/add" options={{ presentation: "modal" }} />
            <Stack.Screen name="medical/prescription/add" options={{ presentation: "modal" }} />
          </Stack>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
