const { Platform } = require("react-native");

if (Platform.OS !== "web") {
  const ExpoSplashScreen = require("expo-splash-screen");
  ExpoSplashScreen.hideAsync().catch(() => {});
  require("./native-shell");
} else {
  require("expo-router/entry");
}
