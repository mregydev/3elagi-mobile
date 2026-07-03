import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

interface Props {
  roomUrl: string;
  embedUrl: string;
}

export function WherebyMeetingEmbed({ embedUrl }: Props) {
  return (
    <View style={styles.root}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
});
