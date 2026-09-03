import { Redirect } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { ConsultationsSection } from "@/components/consultations/ConsultationsSection";
import { PatientConsultationsSection } from "@/components/consultations/PatientConsultationsSection";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { useColors } from "@/hooks/useColors";

export default function ConsultationsTab() {
  const colors = useColors();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const isDoctor = role?.toLowerCase() === "doctor";

  if (!isSignedIn(profile, accessToken)) {
    return <Redirect href="/welcome" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader />
      {isDoctor ? <ConsultationsSection /> : <PatientConsultationsSection />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
