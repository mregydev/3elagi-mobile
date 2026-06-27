import React, { useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";
import WebView from "react-native-webview";
import colors from "@/constants/colors";
import {
  isAiChatWebPath,
  isNormalChatWebPath,
  WEB_APP_PATHS,
} from "@/constants/webAppPaths";
import { WEB_APP_URL } from "@/constants/webAppUrl";
import { setWebAppNavigator } from "@/domains/push/webViewNavigation";

function pathFromUri(uri: string, baseUrl: string): string {
  try {
    return new URL(uri).pathname;
  } catch {
    const prefix = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return uri.startsWith(prefix) ? uri.slice(prefix.length - 1) : uri;
  }
}

export function AppWebView() {
  const webViewRef = useRef<WebView>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const baseUrl = useMemo(
    () => (process.env.EXPO_PUBLIC_WEB_APP_URL ?? WEB_APP_URL).replace(/\/$/, ""),
    [],
  );
  const [uri, setUri] = useState(`${baseUrl}/`);
  const path = useMemo(() => pathFromUri(uri, baseUrl), [uri, baseUrl]);

  useEffect(() => {
    setWebAppNavigator((nextPath) => {
      const normalized = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
      setUri(`${baseUrl}${normalized}`);
    });
    return () => setWebAppNavigator(null);
  }, [baseUrl]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isNormalChatWebPath(path)) {
        setUri(`${baseUrl}${WEB_APP_PATHS.history}`);
        return true;
      }
      if (isAiChatWebPath(path)) {
        setUri(`${baseUrl}${WEB_APP_PATHS.assistant}`);
        return true;
      }
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [path, canGoBack, baseUrl]);

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Web app failed to load</Text>
        <Text style={styles.errorBody}>{loadError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      <WebView
        ref={webViewRef}
        source={{ uri }}
        style={styles.webview}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        mixedContentMode="always"
        allowsBackForwardNavigationGestures={false}
        setSupportMultipleWindows={false}
        startInLoadingState
        onNavigationStateChange={(event) => setCanGoBack(event.canGoBack)}
        onError={() => {
          setLoadError(`Could not load ${uri}. Check your internet connection.`);
        }}
        onHttpError={() => {
          setLoadError(`Could not load ${uri}. Check your internet connection.`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    minHeight: 0,
  },
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
