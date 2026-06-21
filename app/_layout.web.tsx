import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { AppSplash } from "@/components/SplashScreen";
import { AuthRedirect } from "@/components/AuthRedirect";
import { ChatMessageSync } from "@/components/ChatMessageSync";
import { PresenceChatSync } from "@/components/PresenceChatSync";
import { PresenceSocket } from "@/components/PresenceSocket";
import { useAuthStore } from "@/domains/auth/store";
import { fetchAllMedicalHistory } from "@/domains/medical/api";
import { useMedicalStore } from "@/domains/medical/store";
import { usePointsStore } from "@/domains/points/store";
import { useColors } from "@/hooks/useColors";

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
  const colors = useColors();
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashDone = useCallback(() => setShowSplash(false), []);

  if (showSplash) {
    return <AppSplash onDone={handleSplashDone} />;
  }

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <StatusBar style="dark" />
          <MedicalDataLoader />
          <PointsDataLoader />
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
          </Stack>
        </View>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    minHeight: "100%",
  },
});
