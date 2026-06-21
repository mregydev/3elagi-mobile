import AddMedicalScreen from "./add.tsx";
import { MedicalAddWebView } from "@/components/medical/MedicalAddWebView";
import { WebDesktopShell } from "@/components/web/WebDesktopShell";
import { useWebLayout } from "@/hooks/useWebLayout";

export default function AddMedicalScreenWeb() {
  const { isDesktop } = useWebLayout();

  if (!isDesktop) {
    return <AddMedicalScreen />;
  }

  return (
    <WebDesktopShell>
      <MedicalAddWebView />
    </WebDesktopShell>
  );
}
