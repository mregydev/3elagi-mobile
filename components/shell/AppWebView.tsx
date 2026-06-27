import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import WebView from "react-native-webview";
import colors from "@/constants/colors";
import { WEB_APP_URL } from "@/constants/webAppUrl";

export function AppWebView() {
  const [loadError, setLoadError] = useState<string | null>(null);
  const url = process.env.EXPO_PUBLIC_WEB_APP_URL ?? WEB_APP_URL;

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Web app failed to load</Text>
        <Text style={styles.errorBody}>{loadError}</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: url }}
      style={styles.webview}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      mixedContentMode="always"
      allowsBackForwardNavigationGestures={false}
      setSupportMultipleWindows={false}
      startInLoadingState
      onError={() => {
        setLoadError(`Could not load ${url}. Check your internet connection.`);
      }}
      onHttpError={() => {
        setLoadError(`Could not load ${url}. Check your internet connection.`);
      }}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.light.background,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.light.text,
    marginBottom: 8,
    textAlign: "center",
  },
  errorBody: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
  },
});
