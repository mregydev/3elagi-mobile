import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { MedicalAddWebView } from "@/components/medical/MedicalAddWebView";
import { WebDesktopShell } from "@/components/web/WebDesktopShell";
import { useAuthStore } from "@/domains/auth/store";
import { resolveMedicalOwnerUserId } from "@/domains/medical/ownerUserId";

export default function AddMedicalScreenWeb() {
  const { category, patientUserId: patientUserIdParam } = useLocalSearchParams<{
    category?: string;
    patientUserId?: string;
  }>();
  const profile = useAuthStore((s) => s.profile);
  const ownerUserId = resolveMedicalOwnerUserId(patientUserIdParam, profile?.id);

  useEffect(() => {
    if (category === "prescription") {
      const params = ownerUserId ? `?patientUserId=${encodeURIComponent(ownerUserId)}` : "";
      router.replace(`/medical/prescription/add${params}` as never);
    }
  }, [category, ownerUserId]);

  if (category === "prescription") return null;

  return (
    <WebDesktopShell>
      <MedicalAddWebView />
    </WebDesktopShell>
  );
}
