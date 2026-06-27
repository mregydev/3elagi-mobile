import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppWebView } from "@/components/shell/AppWebView";
import { NativePushBootstrap } from "@/components/shell/NativePushBootstrap";
import colors from "@/constants/colors";

export function NativeWebShell() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <NativePushBootstrap />
        <View style={styles.webviewFrame}>
          <AppWebView />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  webviewFrame: {
    flex: 1,
    paddingHorizontal: 12,
  },
});
