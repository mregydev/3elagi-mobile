import * as SplashScreen from "expo-splash-screen";

// Keep the native splash visible until AppSplash paints (must run before expo-router boot).
SplashScreen.preventAutoHideAsync().catch(() => {});

import "expo-router/entry";
