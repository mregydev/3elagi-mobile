import React, { useEffect } from "react";
import { Platform } from "react-native";
import { getFirebaseProjectId, isFirebaseReady } from "@/domains/firebase/app";
import { initFirebaseMessaging } from "@/domains/firebase/messaging";

/**
 * Initializes Firebase on native builds (auto-configured from google-services.json).
 * Registers for FCM and logs the device token in development for backend wiring.
 */
export function FirebaseBootstrap() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    void (async () => {
      const token = await initFirebaseMessaging();
      if (__DEV__) {
        const projectId = getFirebaseProjectId();
        console.log(
          `[firebase] ready=${isFirebaseReady()} project=${projectId ?? "unknown"} token=${token ? "yes" : "no"}`,
        );
      }
    })();
  }, []);

  return null;
}
