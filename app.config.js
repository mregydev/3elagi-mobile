const app = require("./app.json");

const EAS_PROJECT_ID = "c4d6c5d2-8664-4a92-b30a-2205f11532b5";
const ONESIGNAL_APP_ID = "cdb484c9-84b2-4239-bbf8-cefe299e554c";
const BUNDLE_ID = app.expo.ios?.bundleIdentifier ?? "com.threelagi.mobile";
/** Must match `constants/push.ts` */
const ACTIVE_PUSH_PROVIDER = "expo";

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

const oneSignalPlugins =
  ACTIVE_PUSH_PROVIDER === "onesignal"
    ? [
        [
          "onesignal-expo-plugin",
          {
            mode: "development",
            disableLocation: true,
          },
        ],
      ]
    : [];

module.exports = {
  expo: {
    ...app.expo,
    ios: {
      ...app.expo.ios,
      infoPlist: {
        UIBackgroundModes: ["remote-notification"],
      },
      ...(ACTIVE_PUSH_PROVIDER === "onesignal"
        ? {
            entitlements: {
              "aps-environment": "development",
              "com.apple.security.application-groups": [
                `group.${BUNDLE_ID}.onesignal`,
              ],
            },
          }
        : {}),
    },
    android: {
      ...app.expo.android,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ??
        app.expo.android?.googleServicesFile ??
        "./google-services.json",
    },
    extra: {
      ...app.expo.extra,
      eas: {
        ...app.expo.extra?.eas,
        projectId: EAS_PROJECT_ID,
      },
      ...(ACTIVE_PUSH_PROVIDER === "onesignal"
        ? { oneSignalAppId: ONESIGNAL_APP_ID }
        : {}),
      pushProvider: ACTIVE_PUSH_PROVIDER,
    },
    plugins: [...oneSignalPlugins, ...basePlugins],
  },
};
