import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { NotificationsInboxBootstrap } from "@/components/NotificationsInboxBootstrap";
import { PushNotificationsBootstrap } from "@/components/PushNotificationsBootstrap";
import { WebChatNotificationsBootstrap } from "@/components/WebChatNotificationsBootstrap";
import { Ask3elagiAiWidget } from "@/components/assistant/Ask3elagiAiWidget";
import { AppToast } from "@/components/AppToast";
import { AppointmentNotifications } from "@/components/AppointmentNotifications";
import { AppointmentSync } from "@/components/AppointmentSync";
import { IntakeExamNotifications } from "@/components/IntakeExamNotifications";
import { IntakeExamSync } from "@/components/IntakeExamSync";
import { ChatNotifications } from "@/components/ChatNotifications";
import { DocumentRequestAlert } from "@/components/medical/DocumentRequestAlert";
import { HardwareBackHandler } from "@/components/HardwareBackHandler";
import { IncomingVideoCallOverlay } from "@/components/IncomingVideoCallOverlay";
import { AppSplash } from "@/components/SplashScreen";
import { NavLoadingOverlay } from "@/components/NavLoadingOverlay";
import { SystemNotifications } from "@/components/SystemNotifications";
import { SystemNotificationSync } from "@/components/SystemNotificationSync";
import { LocaleBootstrap } from "@/components/LocaleBootstrap";
import { LocaleAuthSync } from "@/components/LocaleAuthSync";
import { AuthRedirect } from "@/components/AuthRedirect";
import { GuestAuthRequiredDialog } from "@/components/auth/GuestAuthRequiredDialog";
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

  return (
    <>
      <PushNotificationsBootstrap />
      <WebChatNotificationsBootstrap />
      <PresenceSocket />
      <NotificationsInboxBootstrap />
      <PresenceChatSync />
      <ChatMessageSync />
      <AppointmentSync />
      <IntakeExamSync />
      <SystemNotificationSync />
      <ChatNotifications />
      <DocumentRequestAlert />
      <AppointmentNotifications />
      <IntakeExamNotifications />
      <SystemNotifications />
      <IncomingVideoCallOverlay />
      <HardwareBackHandler />
      {showSplash ? (
        <AppSplash onDone={handleSplashDone} />
      ) : (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.light.background }}>
          <SafeAreaProvider>
            <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
              <StatusBar style="dark" />
              <MedicalDataLoader />
              <PointsDataLoader />
              <RemindersBootstrap />
              <LocaleBootstrap />
              <LocaleAuthSync />
              <AuthRedirect />
              <View style={{ flex: 1 }}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="welcome" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="auth/login" options={{ presentation: "modal" }} />
                  <Stack.Screen name="auth/signup" options={{ presentation: "modal" }} />
                  <Stack.Screen name="auth/verify-email" options={{ presentation: "modal" }} />
                  <Stack.Screen name="auth/forgot-password" options={{ presentation: "modal" }} />
                  <Stack.Screen name="auth/reset-password" options={{ presentation: "modal" }} />
                  <Stack.Screen name="auth/choose-country" options={{ presentation: "modal" }} />
                  <Stack.Screen name="contact" />
                  <Stack.Screen name="chat/[id]" />
                  <Stack.Screen name="video-call" />
                  <Stack.Screen name="ai/[id]" />
                  <Stack.Screen name="doctor/[doctorId]" />
                  <Stack.Screen name="patients/[userId]" />
                  <Stack.Screen name="medical/add" options={{ presentation: "modal" }} />
                  <Stack.Screen name="medical/add-method" options={{ presentation: "modal" }} />
                  <Stack.Screen name="medical/add-ai" options={{ presentation: "modal" }} />
                  <Stack.Screen name="medical/prescription/add" options={{ presentation: "modal" }} />
                  <Stack.Screen name="medical/[id]" />
                  <Stack.Screen name="medical/request/[id]" />
                  <Stack.Screen name="doctor-pending" />
                  <Stack.Screen name="points/checkout" />
                </Stack>
                <NavLoadingOverlay />
                <AppToast />
                <Ask3elagiAiWidget />
                <GuestAuthRequiredDialog />
              </View>
            </KeyboardProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      )}
    </>
  );
}
