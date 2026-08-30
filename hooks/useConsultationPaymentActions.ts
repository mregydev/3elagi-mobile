import * as DocumentPicker from "expo-document-picker";
import { useCallback, useState } from "react";
import type { PaymentReply } from "@/components/chat/PaymentActionPanel";
import {
  reviewConsultationPayment,
  submitConsultationPaymentProof,
} from "@/domains/consultations/api";
import { useAuthStore } from "@/domains/auth/store";
import { uploadFile } from "@/domains/medical/api";
import { useI18n } from "@/hooks/useI18n";
import { showErrorToast } from "@/utils/toast";

export function useConsultationPaymentActions(onSuccess?: () => void) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { t, isRTL } = useI18n();
  const [busy, setBusy] = useState(false);

  const handlePaymentReply = useCallback(
    async (consultationId: string, reply: PaymentReply) => {
      if (!accessToken || busy) return;
      setBusy(true);
      try {
        let proofUrl = "";
        if (reply === "submit") {
          const picked = await DocumentPicker.getDocumentAsync({
            type: ["image/*", "application/pdf"],
            copyToCacheDirectory: true,
          });
          if (picked.canceled || !picked.assets[0]) return;
          const asset = picked.assets[0];
          const uploaded = await uploadFile(
            asset.uri,
            asset.mimeType ?? "image/jpeg",
            asset.name || `receipt-${Date.now()}`,
            accessToken,
            asset.file,
          );
          proofUrl = uploaded.url;
          await submitConsultationPaymentProof(consultationId, proofUrl, accessToken);
        } else {
          await reviewConsultationPayment(
            consultationId,
            reply === "approve",
            accessToken,
          );
        }
        onSuccess?.();
      } catch (e) {
        showErrorToast(
          t.common.error,
          e instanceof Error
            ? e.message
            : isRTL
              ? "تعذر تحديث الدفع"
              : "Could not update the payment",
        );
      } finally {
        setBusy(false);
      }
    },
    [accessToken, busy, isRTL, onSuccess, t.common.error],
  );

  return { busy, handlePaymentReply };
}
