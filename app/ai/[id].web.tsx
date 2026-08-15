import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";

/** Keep AI deep links inside the tab shell so sidebar nav stays available. */
export default function AiChatDeepLinkWeb() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const chatId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined;

  if (!chatId) return <Redirect href="/(tabs)/assistant" />;

  return (
    <Redirect
      href={{
        pathname: "/(tabs)/assistant",
        params: { chatId },
      }}
    />
  );
}
