import React from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  roomUrl: string;
  embedUrl: string;
}

export function WherebyMeetingEmbed({ embedUrl }: Props) {
  return (
    <View style={styles.root}>
      <iframe
        src={embedUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        style={styles.iframe}
        title="3elagi video call"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#0f172a",
  },
  iframe: {
    borderWidth: 0,
    width: "100%",
    height: "100%",
    flex: 1,
  } as unknown as import("react-native").ViewStyle,
});
