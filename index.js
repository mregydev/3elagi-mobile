const { Platform } = require("react-native");

if (Platform.OS !== "web") {
  require("expo-splash-screen").preventAutoHideAsync().catch(() => {});
}

require("expo-router/entry");
