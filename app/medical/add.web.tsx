import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { MedicalAddWebView } from "@/components/medical/MedicalAddWebView";
import { WebDesktopShell } from "@/components/web/WebDesktopShell";

export default function AddMedicalScreenWeb() {
  const { category, patientUserId } = useLocalSearchParams<{ category?: string; patientUserId?: string }>();

  useEffect(() => {
    if (category === "prescription") {
      const params = patientUserId ? `?patientUserId=${patientUserId}` : "";
      router.replace(`/medical/prescription/add${params}` as never);
    }
  }, [category, patientUserId]);

  if (category === "prescription") return null;

  return (
    <WebDesktopShell>
      <MedicalAddWebView />
    </WebDesktopShell>
  );
}
