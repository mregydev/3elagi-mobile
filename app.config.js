const app = require("./app.json");

const EAS_PROJECT_ID = "c4d6c5d2-8664-4a92-b30a-2205f11532b5";
const ONESIGNAL_APP_ID = "cdb484c9-84b2-4239-bbf8-cefe299e554c";

const basePlugins = (app.expo.plugins ?? []).map((plugin) => {
  if (Array.isArray(plugin) && plugin[0] === "expo-notifications") {
    return [
      "expo-notifications",
      {
        ...plugin[1],
        enableBackgroundRemoteNotifications: true,
      },
    ];
  }
  return plugin;
});

module.exports = {
  expo: {
    ...app.expo,
    ios: {
      ...app.expo.ios,
      infoPlist: {
        UIBackgroundModes: ["remote-notification"],
      },
    },
    extra: {
      ...app.expo.extra,
      eas: {
        ...app.expo.extra?.eas,
        projectId: EAS_PROJECT_ID,
      },
      oneSignalAppId: ONESIGNAL_APP_ID,
    },
    plugins: [
      [
        "onesignal-expo-plugin",
        {
          mode: "development",
          disableLocation: true,
        },
      ],
      ...basePlugins,
    ],
  },
};
