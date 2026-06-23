const { Platform } = require("react-native");

if (Platform.OS !== "web") {
  const ExpoSplashScreen = require("expo-splash-screen");
  ExpoSplashScreen.preventAutoHideAsync().catch(() => {});
  setTimeout(() => {
    ExpoSplashScreen.hideAsync().catch(() => {});
  }, 12000);
}

require("expo-router/entry");
