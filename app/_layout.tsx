import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppSplash } from "@/components/SplashScreen";

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {showSplash ? (
        <AppSplash onDone={() => setShowSplash(false)} />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" options={{ presentation: "modal" }} />
          <Stack.Screen name="auth/signup" options={{ presentation: "modal" }} />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="medical/add" options={{ presentation: "modal" }} />
        </Stack>
      )}
    </SafeAreaProvider>
  );
}
