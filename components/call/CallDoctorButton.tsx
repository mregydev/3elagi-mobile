import { useRouter } from "expo-router";
import { Phone } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet } from "react-native";
import { useAuthStore } from "@/domains/auth/store";
import { initiateVideoCall } from "@/domains/video-call/api";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { showErrorToast } from "@/utils/toast";
import { webConfirm } from "@/utils/webConfirm";

type Props = {
  doctorUserId: string;
  /** Credits held for the call — the doctor's video consultation price. */
  price?: number;
  /** Offline doctors cannot pick up, so the button is dead. */
  offline?: boolean;
};

/**
 * Patient-side "call now" button. The doctor must have immediate calls on;
 * the server holds the credits and rejects a second caller.
 */
export function CallDoctorButton({ doctorUserId, price, offline = false }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [calling, setCalling] = useState(false);

  const start = async () => {
    if (!accessToken || calling || offline) return;
    const body = t.auth.callConfirmBody.replace("{price}", String(price ?? 1));

    const confirmed =
      Platform.OS === "web"
        ? webConfirm(t.auth.callConfirmTitle, body)
        : await new Promise<boolean>((resolve) => {
            Alert.alert(t.auth.callConfirmTitle, body, [
              { text: t.common.cancel, style: "cancel", onPress: () => resolve(false) },
              { text: t.auth.callDoctor, onPress: () => resolve(true) },
            ]);
          });
    if (!confirmed) return;

    setCalling(true);
    try {
      const session = await initiateVideoCall(accessToken, doctorUserId);
      router.push({
        pathname: "/video-call",
        params: { sessionId: session.id },
      });
    } catch (e) {
      // Busy line / not enough credits / calls disabled all arrive as messages.
      showErrorToast(e instanceof Error ? e.message : t.auth.callDoctorBusy);
    } finally {
      setCalling(false);
    }
  };

  return (
    <Pressable
      onPress={() => void start()}
      disabled={calling || offline}
      accessibilityRole="button"
      accessibilityLabel={offline ? t.auth.callDoctorOffline : t.auth.callDoctor}
      hitSlop={8}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.btn,
        {
          borderColor: offline ? colors.border : colors.primary,
          backgroundColor:
            !offline && (pressed || hovered) ? `${colors.primary}14` : colors.card,
          opacity: calling || offline ? 0.45 : 1,
          marginStart: isRTL ? 0 : 6,
          marginEnd: isRTL ? 6 : 0,
        },
      ]}
    >
      {calling ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Phone size={18} color={offline ? colors.mutedForeground : colors.primary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as "auto",
  },
});
