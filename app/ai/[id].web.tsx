import React from "react";
import AssistantScreenWeb from "../(tabs)/assistant.web";
import { WebMobileTabShell } from "@/components/web/WebMobileTabShell";
import { useWebLayout } from "@/hooks/useWebLayout";

export default function AiChatDeepLinkWeb() {
  const { isDesktop } = useWebLayout();

  if (isDesktop) {
    return <AssistantScreenWeb />;
  }

  return (
    <WebMobileTabShell>
      <AssistantScreenWeb />
    </WebMobileTabShell>
  );
}
