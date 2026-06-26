import { MedicalRecordWebView } from "@/components/medical/MedicalRecordWebView";
import { WebDesktopShell } from "@/components/web/WebDesktopShell";
import { useWebLayout } from "@/hooks/useWebLayout";

export default function MedicalRecordScreenWeb() {
  const { isDesktop } = useWebLayout();
  const content = <MedicalRecordWebView />;

  if (!isDesktop) return content;

  return <WebDesktopShell>{content}</WebDesktopShell>;
}
