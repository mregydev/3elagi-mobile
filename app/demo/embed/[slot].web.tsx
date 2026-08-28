import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { isDemoSlot } from "@/constants/demo";
import { persistDemoSlot } from "@/domains/auth/demoSession";
import { getPostAuthRoute } from "@/domains/auth/navigation";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";

/** Bootstraps an isolated demo session then enters the normal app inside the iframe. */
export default function DemoEmbedScreen() {
  const colors = useColors();
  const { slot: slotParam } = useLocalSearchParams<{ slot?: string | string[] }>();
  const slotRaw = Array.isArray(slotParam) ? slotParam[0] : slotParam;
  const hydrated = useAuthStore((s) => s.hydrated);
  const role = useAuthStore((s) => s.role);
  const doctorApprovalStatus = useAuthStore((s) => s.doctorApprovalStatus);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (slotRaw && isDemoSlot(slotRaw)) {
      persistDemoSlot(slotRaw);
    }
  }, [slotRaw]);

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    router.replace(getPostAuthRoute(role, doctorApprovalStatus));
  }, [hydrated, accessToken, role, doctorApprovalStatus]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
