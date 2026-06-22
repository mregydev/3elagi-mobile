import { MedicalRecordWebView } from "@/components/medical/MedicalRecordWebView";
import { WebDesktopShell } from "@/components/web/WebDesktopShell";

export default function MedicalRecordScreenWeb() {
  return (
    <WebDesktopShell>
      <MedicalRecordWebView />
    </WebDesktopShell>
  );
}
