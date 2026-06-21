import ChatScreen from "./[id].tsx";
import { WebDesktopShell } from "@/components/web/WebDesktopShell";
import { useWebLayout } from "@/hooks/useWebLayout";

export default function ChatScreenWeb() {
  const { isDesktop } = useWebLayout();

  if (!isDesktop) {
    return <ChatScreen />;
  }

  return (
    <WebDesktopShell>
      <ChatScreen desktopLayout />
    </WebDesktopShell>
  );
}
