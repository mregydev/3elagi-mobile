import { useEffect } from "react";
import { Platform } from "react-native";

/** Same project as the web tag in `public/index.html`. */
const CLARITY_PROJECT_ID = "yak30uwjsp";

/**
 * Microsoft Clarity on native. Web loads the tag from `public/index.html`, so
 * this is native-only — the SDK is a native module and does nothing (Expo Go
 * included) without a rebuilt dev/APK build.
 */
export function ClarityBootstrap() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    // ponytail: inline require so the native module is never evaluated on web.
    const Clarity = require("@microsoft/react-native-clarity");
    Clarity.initialize(CLARITY_PROJECT_ID, {
      logLevel: __DEV__ ? Clarity.LogLevel.Verbose : Clarity.LogLevel.None,
    });
  }, []);

  return null;
}
